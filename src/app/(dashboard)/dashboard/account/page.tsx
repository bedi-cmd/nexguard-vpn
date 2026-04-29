import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserVpnAccount } from "@/lib/vpn-data";
import { ChangeAccountPasswordForm } from "@/components/dashboard/change-account-password-form";
import { ChangeVpnPasswordForm } from "@/components/dashboard/change-vpn-password-form";
import { TotpSetup } from "@/components/dashboard/totp-setup";
import { DeleteAccount } from "@/components/dashboard/delete-account";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user, vpnAccount] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    getUserVpnAccount(session.user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">Account</h1>
        <p className="mt-1 text-slate-400">Profile, security, and VPN credentials.</p>
      </header>

      {/* Profile */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Email">
            <span className="text-slate-200">{user.email}</span>
            {user.emailVerified ? (
              <Badge className="ml-2 bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                verified
              </Badge>
            ) : (
              <Badge className="ml-2 bg-amber-500/10 text-amber-300 border-amber-500/30">
                unverified
              </Badge>
            )}
          </Row>
          <Row label="Name">
            <span className="text-slate-200">{user.name ?? "—"}</span>
          </Row>
          <Row label="Member since">
            <span className="text-slate-200">{formatDate(user.createdAt)}</span>
          </Row>
          <Row label="Role">
            <span className="text-slate-200">{user.role}</span>
          </Row>
        </CardContent>
      </Card>

      {/* Account password */}
      {user.passwordHash && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Change account password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangeAccountPasswordForm />
          </CardContent>
        </Card>
      )}

      {/* 2FA */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <TotpSetup enabled={user.totpEnabled} />
        </CardContent>
      </Card>

      {/* VPN password */}
      {vpnAccount ? (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>VPN credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">
              VPN username: <code className="rounded bg-slate-800 px-1.5">{vpnAccount.vpnUsername}</code>{" "}
              · Status: <Badge>{vpnAccount.status}</Badge>
            </p>
            <ChangeVpnPasswordForm />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>VPN credentials</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400">
            You don&apos;t have a VPN account yet. Once you check out a plan it will be provisioned
            automatically.
          </CardContent>
        </Card>
      )}

      {/* Danger zone */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-200">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-100/80 space-y-3">
          <p>
            Deleting your account terminates your VPN account upstream and removes every record
            we have for you. This cannot be undone.
          </p>
          <DeleteAccount email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-32 text-slate-400">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
