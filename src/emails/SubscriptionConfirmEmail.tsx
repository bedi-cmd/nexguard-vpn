import { Section, Text } from "@react-email/components";
import { BaseEmail } from "./_layout";
import { MessageCard, emailStyles } from "./_components";

interface Props {
  appName: string;
  appUrl: string;
  planLabel: string;
  amount: string;
  vpnUsername?: string | null;
}

export default function SubscriptionConfirmEmail({
  appName,
  appUrl,
  planLabel,
  amount,
  vpnUsername,
}: Props) {
  return (
    <BaseEmail preview={`Welcome to ${planLabel} — your VPN account is ready`}>
      <MessageCard
        title={`You're on ${planLabel}.`}
        body={`Payment of ${amount} received. Your VPN account is provisioned and ready to use on every device.`}
        cta={{ label: "Open dashboard", href: `${appUrl}/dashboard` }}
        secondaryCta={{ label: "Get the apps", href: `${appUrl}/dashboard/downloads` }}
      >
        {vpnUsername && (
          <Section style={{ marginTop: 16 }}>
            <Text style={{ ...emailStyles.subtext, marginBottom: 4 }}>Your VPN username:</Text>
            <Text style={{ ...emailStyles.subtext }}>
              <span style={emailStyles.codeStyle}>{vpnUsername}</span>
            </Text>
            <Text style={{ ...emailStyles.subtext, marginTop: 4 }}>
              Find your password on the dashboard — we never email it.
            </Text>
          </Section>
        )}
      </MessageCard>
      <Text style={{ ...emailStyles.subtext, fontSize: 12, marginTop: 16, textAlign: "center" }}>
        30-day money-back guarantee. Manage your subscription anytime from{" "}
        <span style={emailStyles.codeStyle}>{appUrl}/billing</span>.
      </Text>
      <Text style={{ ...emailStyles.subtext, fontSize: 12, textAlign: "center" }}>
        — The {appName} team
      </Text>
    </BaseEmail>
  );
}
