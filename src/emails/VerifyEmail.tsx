import { Text } from "@react-email/components";
import { BaseEmail } from "./_layout";
import { MessageCard, emailStyles } from "./_components";

interface Props {
  url: string;
  appName: string;
}

export default function VerifyEmail({ url, appName }: Props) {
  return (
    <BaseEmail preview={`Verify your email for ${appName}`}>
      <MessageCard
        title="Verify your email"
        body={`Click the button below to verify your ${appName} email address. The link expires in 24 hours.`}
        cta={{ label: "Verify email", href: url }}
      >
        <Text style={{ ...emailStyles.subtext, fontSize: 12, marginTop: 16 }}>
          If the button doesn&apos;t work, paste this URL into your browser:
        </Text>
        <Text style={{ ...emailStyles.subtext, fontSize: 12, wordBreak: "break-all" }}>
          {url}
        </Text>
      </MessageCard>
    </BaseEmail>
  );
}
