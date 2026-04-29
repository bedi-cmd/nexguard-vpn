import { Text } from "@react-email/components";
import { BaseEmail } from "./_layout";
import { MessageCard, emailStyles } from "./_components";

interface Props {
  appName: string;
  appUrl: string;
  endsOn: string;
}

export default function SubscriptionCancelledEmail({ appName, appUrl, endsOn }: Props) {
  return (
    <BaseEmail preview={`Your ${appName} subscription is cancelled`}>
      <MessageCard
        title="Cancellation confirmed"
        body={`Your subscription is set to end on ${endsOn}. You'll keep full access until then. After that, your VPN account is suspended (not deleted) — restart anytime and your settings come back.`}
        cta={{ label: "Restart subscription", href: `${appUrl}/pricing` }}
        secondaryCta={{ label: "Tell us why", href: `${appUrl}/dashboard/support` }}
      >
        <Text style={{ ...emailStyles.subtext, fontSize: 12, marginTop: 16 }}>
          Bug report or feature request? We read every reply — just hit reply.
        </Text>
      </MessageCard>
    </BaseEmail>
  );
}
