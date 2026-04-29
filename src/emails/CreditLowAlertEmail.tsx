import { Text } from "@react-email/components";
import { BaseEmail } from "./_layout";
import { MessageCard, emailStyles } from "./_components";

interface Props {
  reason: string;
  appUrl: string;
}

export default function CreditLowAlertEmail({ reason, appUrl }: Props) {
  return (
    <BaseEmail preview="Action needed: VPNResellers balance">
      <MessageCard
        title="VPNResellers balance alert"
        body={`Heads up — ${reason}. New VPN provisioning will fail with HTTP 402 until the wallet is topped up.`}
        cta={{ label: "Top up VPNResellers", href: "https://app.vpnresellers.com/" }}
        secondaryCta={{ label: "View admin overview", href: `${appUrl}/admin` }}
      >
        <Text style={{ ...emailStyles.subtext, fontSize: 12, marginTop: 16 }}>
          You&apos;re receiving this because you&apos;re an admin on this NexGuard tenant.
        </Text>
      </MessageCard>
    </BaseEmail>
  );
}
