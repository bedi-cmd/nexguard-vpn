import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VPNResellersClient,
  VPNResellersAPIError,
  VPNResellersNotSupportedError,
  type VpnServer,
  type VpnAccount,
  type VpnPort,
  type GeoIp,
} from "./vpnresellers";

const BASE = "https://api.vpnresellers.com/v3_1";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function makeClient(fetchImpl: typeof fetch) {
  return new VPNResellersClient({
    apiKey: "test-key",
    fetchImpl,
    backoffBaseMs: 1, // make retry tests fast
    timeoutMs: 1000,
    logger: () => {},
  });
}

describe("VPNResellersClient", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe("auth + URL building", () => {
    it("sends Bearer token and Accept header on authed calls", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("Bearer test-key");
        expect(headers.get("Accept")).toBe("application/json");
        expect(String(url)).toBe(`${BASE}/servers`);
        return jsonResponse({ data: [] });
      });

      const client = makeClient(fetchMock as unknown as typeof fetch);
      await client.getServers();
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("omits Authorization header on /geoip", async () => {
      const fetchMock = vi.fn(async (_url: string | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBeNull();
        return jsonResponse({
          data: { ip: "1.1.1.1", country: "US", iso_code: "US", city: "X", lat: 0, lon: 0, continent: "NA" },
        });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      const geo = await client.getGeoIP();
      expect(geo.country).toBe("US");
    });

    it("appends query params and skips undefined values", async () => {
      const fetchMock = vi.fn(async (url: string | URL) => {
        const u = new URL(String(url));
        expect(u.searchParams.get("server_id")).toBe("42");
        expect(u.searchParams.has("port_id")).toBe(false);
        return jsonResponse({ data: { ovpn: "..." } });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await client.getOpenVPNConfig({ serverId: 42 });
      expect(fetchMock).toHaveBeenCalledOnce();
    });
  });

  describe("getServers", () => {
    it("returns the data array", async () => {
      const servers: VpnServer[] = [
        { id: 1, name: "US-NYC-01", ip: "10.0.0.1", country_code: "US", city: "NYC", capacity: 80 },
      ];
      const fetchMock = vi.fn(async () => jsonResponse({ data: servers }));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      expect(await client.getServers()).toEqual(servers);
    });
  });

  describe("getPorts", () => {
    it("returns the ports array", async () => {
      const ports: VpnPort[] = [{ id: 1, protocol: "udp", number: 1194, default: 1 }];
      const fetchMock = vi.fn(async () => jsonResponse({ data: ports }));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      expect(await client.getPorts()).toEqual(ports);
    });
  });

  describe("getGeoIP", () => {
    it("returns the data object", async () => {
      const geo: GeoIp = {
        ip: "8.8.8.8",
        country: "United States",
        iso_code: "US",
        city: "Mountain View",
        lat: 37.4,
        lon: -122.1,
        continent: "North America",
      };
      const fetchMock = vi.fn(async () => jsonResponse({ data: geo }));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      expect(await client.getGeoIP()).toEqual(geo);
    });
  });

  describe("createAccount", () => {
    it("POSTs username + password and returns the account", async () => {
      const account: VpnAccount = {
        id: 7,
        username: "alice",
        status: "Active",
        wg_ip: "10.7.0.1",
        wg_private_key: "priv",
        wg_public_key: "pub",
        created: "2026-01-01T00:00:00Z",
        updated: "2026-01-01T00:00:00Z",
      };
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("POST");
        expect(String(url)).toBe(`${BASE}/accounts`);
        expect(JSON.parse(init?.body as string)).toEqual({ username: "alice", password: "p@ss" });
        return jsonResponse({ data: account }, { status: 201 });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      expect(await client.createAccount({ username: "alice", password: "p@ss" })).toEqual(account);
    });

    it("surfaces 402 Insufficient Balance via isInsufficientBalance flag", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ message: "Insufficient Balance." }), { status: 402 }),
      );
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await expect(client.createAccount({ username: "bob", password: "x" })).rejects.toMatchObject({
        name: "VPNResellersAPIError",
        status: 402,
        isInsufficientBalance: true,
        isRetryable: false,
      });
      expect(fetchMock).toHaveBeenCalledOnce(); // no retry on 4xx
    });

    it("surfaces 422 validation errors with fieldErrors map", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: "The given data was invalid.",
            errors: { username: ["The username has already been taken."] },
          }),
          { status: 422 },
        ),
      );
      const client = makeClient(fetchMock as unknown as typeof fetch);
      try {
        await client.createAccount({ username: "x", password: "y" });
        expect.unreachable("should have thrown");
      } catch (err) {
        if (!(err instanceof VPNResellersAPIError)) throw err;
        expect(err.status).toBe(422);
        expect(err.isValidationError).toBe(true);
        expect(err.fieldErrors?.username?.[0]).toMatch(/already been taken/);
      }
    });
  });

  describe("getAccount + terminateAccount", () => {
    it("GETs /accounts/{id}", async () => {
      const account = makeAccount(99);
      const fetchMock = vi.fn(async (url: string | URL) => {
        expect(String(url)).toBe(`${BASE}/accounts/99`);
        return jsonResponse({ data: account });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      expect(await client.getAccount(99)).toEqual(account);
    });

    it("DELETEs /accounts/{id}", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("DELETE");
        expect(String(url)).toBe(`${BASE}/accounts/99`);
        return new Response(null, { status: 204 });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await expect(client.terminateAccount(99)).resolves.toBeUndefined();
    });
  });

  describe("suspend / unsuspend", () => {
    it("PUTs /accounts/{id}/disable for suspendAccount", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("PUT");
        expect(String(url)).toBe(`${BASE}/accounts/5/disable`);
        return jsonResponse({ data: makeAccount(5, "Disabled") });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      const acc = await client.suspendAccount(5);
      expect(acc.status).toBe("Disabled");
    });

    it("PUTs /accounts/{id}/enable for unsuspendAccount", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("PUT");
        expect(String(url)).toBe(`${BASE}/accounts/5/enable`);
        return jsonResponse({ data: makeAccount(5, "Active") });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      const acc = await client.unsuspendAccount(5);
      expect(acc.status).toBe("Active");
    });
  });

  describe("changePassword", () => {
    it("PUTs /accounts/{id}/change_password with new password", async () => {
      const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
        expect(init?.method).toBe("PUT");
        expect(String(url)).toBe(`${BASE}/accounts/12/change_password`);
        expect(JSON.parse(init?.body as string)).toEqual({ password: "newPass1" });
        return jsonResponse({ data: makeAccount(12) });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await client.changePassword(12, "newPass1");
      expect(fetchMock).toHaveBeenCalledOnce();
    });
  });

  describe("checkUsername", () => {
    it("returns true on 200", async () => {
      const fetchMock = vi.fn(async () => jsonResponse({ data: true }));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      expect(await client.checkUsername("alice")).toBe(true);
    });

    it("returns false on 422 conflict", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ message: "taken", errors: { username: ["taken"] } }), { status: 422 }),
      );
      const client = makeClient(fetchMock as unknown as typeof fetch);
      expect(await client.checkUsername("alice")).toBe(false);
    });
  });

  describe("listAccounts", () => {
    it("passes the page param", async () => {
      const fetchMock = vi.fn(async (url: string | URL) => {
        expect(new URL(String(url)).searchParams.get("page")).toBe("3");
        return jsonResponse({ data: [makeAccount(1)], meta: { total: 1 } });
      });
      const client = makeClient(fetchMock as unknown as typeof fetch);
      const res = await client.listAccounts(3);
      expect(res.data).toHaveLength(1);
      expect(res.meta).toEqual({ total: 1 });
    });
  });

  describe("retry behavior", () => {
    it("retries on 500 and succeeds on the third attempt", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response("boom", { status: 500 }))
        .mockResolvedValueOnce(new Response("boom", { status: 500 }))
        .mockResolvedValueOnce(jsonResponse({ data: [] }));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await client.getServers();
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("throws after maxAttempts on persistent 500", async () => {
      const fetchMock = vi.fn(async () => new Response("nope", { status: 503 }));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await expect(client.getServers()).rejects.toMatchObject({ status: 503 });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("does NOT retry on 4xx", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(JSON.stringify({ message: "Unauthorized." }), { status: 401 }),
      );
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await expect(client.getServers()).rejects.toMatchObject({ status: 401, isUnauthorized: true });
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("retries on network errors (rejected fetch)", async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValueOnce(jsonResponse({ data: [] }));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await client.getServers();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("wraps a final network error as VPNResellersAPIError with status 0", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new TypeError("dns"));
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await expect(client.getServers()).rejects.toMatchObject({
        name: "VPNResellersAPIError",
        status: 0,
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("getCredits", () => {
    it("throws VPNResellersNotSupportedError (no /credits endpoint in v3.1)", async () => {
      const fetchMock = vi.fn();
      const client = makeClient(fetchMock as unknown as typeof fetch);
      await expect(client.getCredits()).rejects.toBeInstanceOf(VPNResellersNotSupportedError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("constructor validation", () => {
    it("throws if apiKey is missing", () => {
      expect(() => new VPNResellersClient({ apiKey: "" })).toThrow(/apiKey/);
    });

    it("strips trailing slashes from baseUrl", async () => {
      const fetchMock = vi.fn(async (url: string | URL) => {
        expect(String(url)).toBe("https://example.com/v3_1/servers");
        return jsonResponse({ data: [] });
      });
      const client = new VPNResellersClient({
        apiKey: "k",
        baseUrl: "https://example.com/v3_1///",
        fetchImpl: fetchMock as unknown as typeof fetch,
        backoffBaseMs: 1,
        logger: () => {},
      });
      await client.getServers();
    });
  });
});

// ───────── helpers ─────────

function makeAccount(id: number, status: VpnAccount["status"] = "Active"): VpnAccount {
  return {
    id,
    username: `u${id}`,
    status,
    wg_ip: `10.0.0.${id}`,
    wg_private_key: "priv",
    wg_public_key: "pub",
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
  };
}
