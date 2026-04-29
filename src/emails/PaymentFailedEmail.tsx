import { Text } from "@react-email/components";
import { BaseEmail } from "./_layout";
import { MessageCard, emailStyles } from "./_components";

interface Props {
  appUrl: string;
  amount: string;
  attemptCount?: number;
  graceDays?: number;
}

export default function PaymentFailedEmail({
  appUrl,
  amount,
  attemptCount = 1,
  graceDays = 3,
}: Props) {
  return (
    <BaseEmail preview="Payment failed — action needed">
      <MessageCard
        title="Payment didn't go through"
        body={`We couldn't process your ${amount} payment (attempt ${attemptCount}). To keep your VPN active, please update your payment method in the next ${graceDays} days.`}
        cta={{ label: "Update payment method", href: `${appUrl}/billing` }}
      >
        <Text style={{ ...emailStyles.subtext, fontSize: 13, marginTop: 16 }}>
          Common causes: expired card, insufficient funds, or your bank flagging the charge.
          Updating your payment method usually resolves it within minutes.
        </Text>
      </MessageCard>
    </BaseEmail>
  );
}
