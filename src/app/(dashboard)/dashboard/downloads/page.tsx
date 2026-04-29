import Link from "next/link";
import { headers } from "next/headers";
import { Apple, Download, Smartphone, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Downloads" };

interface PlatformCard {
  id: "windows" | "macos" | "android" | "ios" | "linux";
  label: string;
  icon: React.ReactNode;
  description: string;
  download: { label: string; href: string }[];
}

const PLATFORMS: PlatformCard[] = [
  {
    id: "windows",
    label: "Windows",
    icon: <MonitorSmartphone className="size-5 text-cyan-400" />,
    description: "Windows 10 + 11, x64 / ARM64.",
    download: [
      { label: "Download .exe", href: "https://help.vpnresellers.com/" },
      { label: "Setup guide", href: "https://help.vpnresellers.com/" },
    ],
  },
  {
    id: "macos",
    label: "macOS",
    icon: <Apple className="size-5 text-cyan-400" />,
    description: "macOS 12+, Intel and Apple Silicon.",
    download: [
      { label: "Download .dmg", href: "https://help.vpnresellers.com/" },
      { label: "Setup guide", href: "https://help.vpnresellers.com/" },
    ],
  },
  {
    id: "android",
    label: "Android",
    icon: <Smartphone className="size-5 text-cyan-400" />,
    description: "Android 8 (Oreo) and newer.",
    download: [
      { label: "Google Play", href: "https://help.vpnresellers.com/" },
      { label: "APK download", href: "https://help.vpnresellers.com/" },
    ],
  },
  {
    id: "ios",
    label: "iOS",
    icon: <Apple className="size-5 text-cyan-400" />,
    description: "iOS 14 and newer (iPhone & iPad).",
    download: [
      { label: "App Store", href: "https://help.vpnresellers.com/" },
      { label: "Setup guide", href: "https://help.vpnresellers.com/" },
    ],
  },
];

function detectPlatform(ua: string): PlatformCard["id"] | null {
  const u = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(u)) return "ios";
  if (/android/.test(u)) return "android";
  if (/macintosh|mac os x/.test(u)) return "macos";
  if (/windows/.test(u)) return "windows";
  return null;
}

export default async function DownloadsPage() {
  const ua = (await headers()).get("user-agent") ?? "";
  const detected = detectPlatform(ua);
  const ordered = detected
    ? [...PLATFORMS].sort((a, b) => (a.id === detected ? -1 : b.id === detected ? 1 : 0))
    : PLATFORMS;

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Downloads</h1>
        <p className="mt-1 text-slate-400">
          Get the app for your device. {detected && `Detected: ${detected}.`}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ordered.map((p) => (
          <Card key={p.id} className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">{p.icon} {p.label}</CardTitle>
              <p className="text-sm text-slate-400 mt-1">{p.description}</p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {p.download.map((d, i) => (
                <Button
                  key={d.label}
                  variant={i === 0 ? "default" : "outline"}
                  render={<Link href={d.href} target="_blank" rel="noreferrer noopener" />}
                >
                  <Download className="size-4" />
                  {d.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Manual configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300 space-y-3">
          <p>
            Prefer to bring your own VPN client? Download a config file directly. WireGuard is
            recommended for speed; OpenVPN over TCP/443 is the best fallback for restrictive
            networks.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>WireGuard (.conf): from the Servers page → server card → download.</li>
            <li>OpenVPN (.ovpn): from the Servers page → server card → download.</li>
          </ul>
          <Button variant="outline" render={<Link href="/dashboard/servers" />}>
            Open server list
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
