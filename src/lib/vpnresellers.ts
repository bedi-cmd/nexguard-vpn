/**
 * VPNResellers API v3.1 client.
 *
 * Docs: https://api.vpnresellers.com/docs/v3_1
 * Auth: Bearer token via VPNRESELLERS_API_KEY env var.
 *
 * Notes vs. the project's architecture blueprint:
 *  - The real v3.1 paths differ from the blueprint approximations:
 *      POST /accounts            (create — was /accounts/create)
 *      DELETE /accounts/{id}     (terminate — was POST /accounts/terminate)
 *      PUT /accounts/{id}/enable (unsuspend — was POST /accounts/unsuspend)
 *      PUT /accounts/{id}/disable (suspend — was POST /accounts/suspend)
 *      PUT /accounts/{id}/change_password (was POST /accounts/password)
 *  - There is NO /credits endpoint in v3.1. Reseller balance can only be
 *    checked via the VPNResellers web dashboard. We expose a stub method
 *    that throws so callers (e.g. the admin panel) get a clear signal.
 *  - The API never returns the VPN account password back. We must persist
 *    the value we sent at creation time (encrypted) on our side.
 */

// ───────── Types ─────────

export interface VpnServer {
  id: number;
  name: string;
  ip: string;
  country_code: string;
  city: string;
  capacity: number;
}

export type VpnAccountStatus = "Active" | "Disabled";

export interface VpnAccount {
  id: number;
  username: string;
  status: VpnAccountStatus;
  wg_ip: string;
  wg_private_key: string;
  wg_public_key: string;
  created: string;
  updated: string;
}

export interface VpnPort {
  id: number;
  protocol: string;
  number: number;
  default: 0 | 1;
}

export interface GeoIp {
  ip: string;
  country: string;
  iso_code: string;
  city: string;
  lat: number;
  lon: number;
  continent: string;
}

export interface PaginatedAccounts {
  data: VpnAccount[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface ListResponse<T> {
  data: T[];
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface ItemResponse<T> {
  data: T;
}

interface CreateAccountInput {
  username: string;
  password: string;
}

interface ConfigQuery {
  serverId: number;
  portId?: number;
}

// ───────── Errors ─────────

/**
 * Thrown when the VPNResellers API returns a non-2xx response or when
 * the network/transport layer fails after all retries.
 */
export class VPNResellersAPIError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly method: string;
  readonly responseBody: unknown;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(args: {
    message: string;
    status: number;
    endpoint: string;
    method: string;
    responseBody?: unknown;
    fieldErrors?: Record<string, string[]>;
  }) {
    super(args.message);
    this.name = "VPNResellersAPIError";
    this.status = args.status;
    this.endpoint = args.endpoint;
    this.method = args.method;
    this.responseBody = args.responseBody;
    this.fieldErrors = args.fieldErrors;
  }

  get isInsufficientBalance() {
    return this.status === 402;
  }

  get isUnauthorized() {
    return this.status === 401 || this.status === 403;
  }

  get isValidationError() {
    return this.status === 422;
  }

  get isRetryable() {
    return this.status >= 500 || this.status === 0;
  }
}

/** Thrown when a method is documented but not supported by v3.1 (e.g. credits). */
export class VPNResellersNotSupportedError extends Error {
  constructor(method: string) {
    super(
      `VPNResellers API v3.1 does not support ${method}. ` +
        "Check the reseller dashboard at https://app.vpnresellers.com/ instead.",
    );
    this.name = "VPNResellersNotSupportedError";
  }
}

// ───────── Client ─────────

export interface VPNResellersClientOptions {
  apiKey: string;
  baseUrl?: string;
  /** Per-request timeout in ms. Default 10000. */
  timeoutMs?: number;
  /** Total attempts (initial + retries). Default 3. */
  maxAttempts?: number;
  /** Base backoff in ms; doubled each retry. Default 1000. */
  backoffBaseMs?: number;
  /** Optional fetch override (used by tests). */
  fetchImpl?: typeof fetch;
  /** Optional logger override. Defaults to console.info. */
  logger?: (line: string) => void;
}

const DEFAULT_BASE_URL = "https://api.vpnresellers.com/v3_1";

export class VPNResellersClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly backoffBaseMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly logger: (line: string) => void;

  constructor(opts: VPNResellersClientOptions) {
    if (!opts.apiKey) {
      throw new Error("VPNResellersClient: apiKey is required");
    }
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.maxAttempts = opts.maxAttempts ?? 3;
    this.backoffBaseMs = opts.backoffBaseMs ?? 1000;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.logger = opts.logger ?? ((line) => console.info(line));
  }

  // ───── Core request plumbing ─────

  private async request<T>(
    method: string,
    path: string,
    options: { query?: Record<string, string | number | undefined>; body?: unknown; auth?: boolean } = {},
  ): Promise<T> {
    const { query, body, auth = true } = options;
    const url = this.buildUrl(path, query);
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (auth) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let lastError: VPNResellersAPIError | null = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      const startedAt = Date.now();
      try {
        const response = await this.fetchImpl(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        const elapsed = Date.now() - startedAt;
        this.log(method, path, response.status, elapsed, attempt);

        if (response.ok) {
          if (response.status === 204) return undefined as T;
          const text = await response.text();
          if (!text) return undefined as T;
          try {
            return JSON.parse(text) as T;
          } catch {
            // Some endpoints (config download) return raw text.
            return text as unknown as T;
          }
        }

        const responseBody = await safeParseBody(response);
        const apiError = new VPNResellersAPIError({
          message: extractMessage(responseBody, response.status),
          status: response.status,
          endpoint: path,
          method,
          responseBody,
          fieldErrors: extractFieldErrors(responseBody),
        });

        if (!apiError.isRetryable || attempt === this.maxAttempts) {
          throw apiError;
        }
        lastError = apiError;
      } catch (err) {
        if (err instanceof VPNResellersAPIError) {
          if (!err.isRetryable || attempt === this.maxAttempts) throw err;
          lastError = err;
        } else {
          // Network error / timeout / abort.
          const message = err instanceof Error ? err.message : String(err);
          this.log(method, path, 0, Date.now() - startedAt, attempt, message);
          const apiError = new VPNResellersAPIError({
            message: `Network error: ${message}`,
            status: 0,
            endpoint: path,
            method,
          });
          if (attempt === this.maxAttempts) throw apiError;
          lastError = apiError;
        }
      }

      await sleep(this.backoffBaseMs * 2 ** (attempt - 1));
    }

    // Unreachable, but TS demands a return.
    throw lastError ?? new Error("VPNResellersClient: request failed");
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>) {
    const url = new URL(this.baseUrl + path);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private log(
    method: string,
    path: string,
    status: number,
    elapsedMs: number,
    attempt: number,
    extra?: string,
  ) {
    const ts = new Date().toISOString();
    const tail = extra ? ` :: ${extra}` : "";
    this.logger(`[${ts}] vpn ${method} ${path} → ${status} (${elapsedMs}ms, attempt ${attempt})${tail}`);
  }

  // ───── Servers / Geo / Ports ─────

  /** Fetch all VPN servers available to the reseller. */
  async getServers(): Promise<VpnServer[]> {
    const res = await this.request<ListResponse<VpnServer>>("GET", "/servers");
    return res.data;
  }

  /** Fetch the list of available OpenVPN ports/protocols. */
  async getPorts(): Promise<VpnPort[]> {
    const res = await this.request<ListResponse<VpnPort>>("GET", "/ports");
    return res.data;
  }

  /** Fetch the caller's geo-IP info (no auth required by the API). */
  async getGeoIP(): Promise<GeoIp> {
    const res = await this.request<ItemResponse<GeoIp>>("GET", "/geoip", { auth: false });
    return res.data;
  }

  // ───── Accounts ─────

  /**
   * Check whether a VPN username is available.
   * Returns true if the username is free.
   */
  async checkUsername(username: string): Promise<boolean> {
    try {
      await this.request<unknown>("GET", "/accounts/check_username", { query: { username } });
      return true;
    } catch (err) {
      if (err instanceof VPNResellersAPIError && (err.status === 409 || err.status === 422)) {
        return false;
      }
      throw err;
    }
  }

  /** List all VPN accounts under the reseller. Pages start at 1. */
  async listAccounts(page?: number): Promise<PaginatedAccounts> {
    return this.request<PaginatedAccounts>("GET", "/accounts", { query: { page } });
  }

  /**
   * Create a new VPN account. Username and password are user-supplied
   * (3–50 chars). The API never returns the password — persist the value
   * you sent (encrypted) on your side.
   */
  async createAccount(input: CreateAccountInput): Promise<VpnAccount> {
    const res = await this.request<ItemResponse<VpnAccount>>("POST", "/accounts", { body: input });
    return res.data;
  }

  /** Retrieve a single VPN account by ID. */
  async getAccount(id: number | string): Promise<VpnAccount> {
    const res = await this.request<ItemResponse<VpnAccount>>("GET", `/accounts/${id}`);
    return res.data;
  }

  /** Permanently terminate a VPN account. */
  async terminateAccount(id: number | string): Promise<void> {
    await this.request<void>("DELETE", `/accounts/${id}`);
  }

  /** Suspend (disable) an active VPN account. */
  async suspendAccount(id: number | string): Promise<VpnAccount> {
    const res = await this.request<ItemResponse<VpnAccount>>("PUT", `/accounts/${id}/disable`);
    return res.data;
  }

  /** Reactivate (enable) a suspended VPN account. */
  async unsuspendAccount(id: number | string): Promise<VpnAccount> {
    const res = await this.request<ItemResponse<VpnAccount>>("PUT", `/accounts/${id}/enable`);
    return res.data;
  }

  /** Change the password for a VPN account (3–50 chars). */
  async changePassword(id: number | string, password: string): Promise<VpnAccount> {
    const res = await this.request<ItemResponse<VpnAccount>>(
      "PUT",
      `/accounts/${id}/change_password`,
      { body: { password } },
    );
    return res.data;
  }

  // ───── Configuration files ─────

  /** Get OpenVPN configuration for a given server (and optional port). */
  async getOpenVPNConfig(query: ConfigQuery): Promise<unknown> {
    return this.request<unknown>("GET", "/configuration", {
      query: { server_id: query.serverId, port_id: query.portId },
    });
  }

  /** Download OpenVPN .ovpn file body for a given server. */
  async downloadOpenVPNConfig(query: ConfigQuery): Promise<string> {
    return this.request<string>("GET", "/configuration/download", {
      query: { server_id: query.serverId, port_id: query.portId },
    });
  }

  /** Get WireGuard config for a specific account+server pair. */
  async getWireGuardConfig(accountId: number | string, serverId: number): Promise<unknown> {
    return this.request<unknown>("GET", `/accounts/${accountId}/wireguard-configuration`, {
      query: { server_id: serverId },
    });
  }

  /** Download WireGuard config file body for a specific account+server pair. */
  async downloadWireGuardConfig(accountId: number | string, serverId: number): Promise<string> {
    return this.request<string>(
      "GET",
      `/accounts/${accountId}/wireguard-configuration/download`,
      { query: { server_id: serverId } },
    );
  }

  // ───── Reseller balance (NOT supported by v3.1) ─────

  /**
   * @deprecated VPNResellers v3.1 does not expose reseller balance.
   * Always throws VPNResellersNotSupportedError.
   * Use the VPNResellers web dashboard, or detect 402 responses on createAccount.
   */
  async getCredits(): Promise<never> {
    throw new VPNResellersNotSupportedError("getCredits");
  }
}

// ───────── Singleton ─────────

let _vpnApi: VPNResellersClient | null = null;

/**
 * Lazy singleton. Reads VPNRESELLERS_API_KEY + VPNRESELLERS_API_URL from env.
 * Throws at first call if API key is missing.
 */
export function vpnApi(): VPNResellersClient {
  if (_vpnApi) return _vpnApi;
  const apiKey = process.env.VPNRESELLERS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "VPNRESELLERS_API_KEY is not set. Get one at https://app.vpnresellers.com/api-access",
    );
  }
  _vpnApi = new VPNResellersClient({
    apiKey,
    baseUrl: process.env.VPNRESELLERS_API_URL,
  });
  return _vpnApi;
}

/** Reset the singleton (used by tests). */
export function _resetVpnApiForTests() {
  _vpnApi = null;
}

// ───────── Helpers ─────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function safeParseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body && typeof (body as { message: unknown }).message === "string") {
    return (body as { message: string }).message;
  }
  return `HTTP ${status}`;
}

function extractFieldErrors(body: unknown): Record<string, string[]> | undefined {
  if (
    body &&
    typeof body === "object" &&
    "errors" in body &&
    body !== null &&
    typeof (body as { errors: unknown }).errors === "object"
  ) {
    return (body as { errors: Record<string, string[]> }).errors;
  }
  return undefined;
}
