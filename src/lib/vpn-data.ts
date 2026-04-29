/**
 * Server-only data accessors that wrap the VPNResellers client + cache layer.
 * UI code (Server Components, API routes) imports from here, NOT from
 * `vpnresellers.ts` directly — that keeps the API key on the server and
 * gives us a place to add caching/transformation.
 */

import "server-only";
import { cached } from "@/lib/cache";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { vpnApi, type VpnServer } from "@/lib/vpnresellers";

const SERVERS_CACHE_KEY = "vpn:servers:v1";
const SERVERS_TTL = 5 * 60; // 5 min

const PORTS_CACHE_KEY = "vpn:ports:v1";
const PORTS_TTL = 60 * 60; // 1 hr (changes rarely)

export async function getCachedServers(): Promise<VpnServer[]> {
  return cached(SERVERS_CACHE_KEY, SERVERS_TTL, async () => vpnApi().getServers());
}

export async function getCachedPorts() {
  return cached(PORTS_CACHE_KEY, PORTS_TTL, async () => vpnApi().getPorts());
}

/** Region grouping helper. Maps ISO country codes to broad regions. */
export function regionFor(isoCode: string): string {
  const c = isoCode.toUpperCase();
  if (
    [
      "US",
      "CA",
      "MX",
      "BR",
      "AR",
      "CO",
      "CL",
      "PE",
      "VE",
      "EC",
      "DO",
      "PA",
      "CR",
      "UY",
    ].includes(c)
  )
    return "Americas";
  if (
    [
      "GB",
      "IE",
      "FR",
      "DE",
      "NL",
      "BE",
      "LU",
      "ES",
      "PT",
      "IT",
      "CH",
      "AT",
      "SE",
      "NO",
      "FI",
      "DK",
      "PL",
      "CZ",
      "SK",
      "HU",
      "RO",
      "BG",
      "GR",
      "TR",
      "RU",
      "UA",
      "EE",
      "LV",
      "LT",
      "RS",
      "HR",
      "SI",
      "IS",
      "MT",
      "CY",
    ].includes(c)
  )
    return "Europe";
  if (
    [
      "JP",
      "KR",
      "CN",
      "HK",
      "TW",
      "SG",
      "MY",
      "TH",
      "VN",
      "PH",
      "ID",
      "IN",
      "KZ",
      "AE",
      "SA",
      "IL",
      "QA",
      "OM",
      "PK",
      "BD",
      "LK",
    ].includes(c)
  )
    return "Asia";
  if (["AU", "NZ", "FJ"].includes(c)) return "Oceania";
  if (["ZA", "EG", "NG", "KE", "MA", "GH", "TN", "DZ", "ET"].includes(c))
    return "Africa";
  return "Other";
}

export interface PlainVpnAccount {
  id: string;
  vpnResellersId: string;
  vpnUsername: string;
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  protocolPref: string;
  createdAt: Date;
}

/** The user's primary (non-terminated) VPN account, if any. */
export async function getUserVpnAccount(userId: string): Promise<PlainVpnAccount | null> {
  const row = await db.vpnAccount.findFirst({
    where: { userId, status: { in: ["ACTIVE", "SUSPENDED"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  return {
    id: row.id,
    vpnResellersId: row.vpnResellersId,
    vpnUsername: row.vpnUsername,
    status: row.status,
    protocolPref: row.protocolPref,
    createdAt: row.createdAt,
  };
}

/** Returns the decrypted VPN password for the given account row. Server-only. */
export async function getVpnPassword(accountId: string): Promise<string | null> {
  const row = await db.vpnAccount.findUnique({ where: { id: accountId } });
  if (!row) return null;
  try {
    return decrypt(row.vpnPasswordEnc);
  } catch (err) {
    console.error("[vpn-data] failed to decrypt password", err);
    return null;
  }
}
