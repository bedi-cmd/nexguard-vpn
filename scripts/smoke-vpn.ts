/**
 * Smoke test for the VPNResellers API client against the real API.
 *
 * Usage:
 *   1. Put VPNRESELLERS_API_KEY in .env.local (or export it in your shell).
 *   2. npx tsx scripts/smoke-vpn.ts
 *
 * Calls a couple of read-only endpoints. Will not create, modify, or delete
 * any VPN accounts.
 */

import "dotenv/config";
import { VPNResellersClient, VPNResellersAPIError } from "../src/lib/vpnresellers";

// dotenv/config doesn't read .env.local by default — load it explicitly.
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const localPath = resolve(process.cwd(), ".env.local");
if (existsSync(localPath)) {
  loadEnv({ path: localPath, override: true });
}

const apiKey = process.env.VPNRESELLERS_API_KEY;
if (!apiKey) {
  console.error("✖ VPNRESELLERS_API_KEY is not set.");
  console.error("  Add it to .env.local or export it before running this script.");
  console.error("  Get a key at https://app.vpnresellers.com/api-access");
  process.exit(1);
}

const client = new VPNResellersClient({
  apiKey,
  baseUrl: process.env.VPNRESELLERS_API_URL,
});

async function main() {
  console.log("→ getGeoIP() (no auth required)...");
  const geo = await client.getGeoIP();
  console.log(`  ${geo.iso_code} ${geo.city} (${geo.ip})`);

  console.log("→ getServers()...");
  const servers = await client.getServers();
  console.log(`  ${servers.length} servers across ${new Set(servers.map((s) => s.country_code)).size} countries`);
  if (servers.length > 0) {
    const sample = servers.slice(0, 3);
    for (const s of sample) {
      console.log(`    · #${s.id} ${s.country_code} / ${s.city} — capacity ${s.capacity}`);
    }
    if (servers.length > 3) console.log(`    · ... and ${servers.length - 3} more`);
  }

  console.log("→ getPorts()...");
  const ports = await client.getPorts();
  console.log(`  ${ports.length} ports: ${ports.slice(0, 5).map((p) => `${p.protocol}:${p.number}`).join(", ")}`);

  console.log("→ listAccounts(page 1)...");
  const accounts = await client.listAccounts(1);
  const total =
    (accounts.meta && typeof accounts.meta === "object" && "total" in accounts.meta
      ? Number((accounts.meta as { total: unknown }).total)
      : accounts.data.length);
  console.log(`  ${accounts.data.length} on page 1 (total reported: ${total})`);

  console.log("\n✓ Smoke test passed.");
}

main().catch((err) => {
  if (err instanceof VPNResellersAPIError) {
    console.error(`\n✖ API error ${err.status} on ${err.method} ${err.endpoint}`);
    console.error(`  ${err.message}`);
    if (err.fieldErrors) console.error("  fieldErrors:", err.fieldErrors);
  } else {
    console.error("\n✖ Unexpected error:", err);
  }
  process.exit(1);
});
