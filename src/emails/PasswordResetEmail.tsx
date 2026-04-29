import { Text } from "@react-email/components";
import { BaseEmail } from "./_layout";
import { MessageCard, emailStyles } from "./_components";

interface Props {
  url: string;
  appName: string;
}

export default function PasswordResetEmail({ url, appName }: Props) {
  return (
    <BaseEmail preview={`Reset your ${appName} password`}>
      <MessageCard
        title="Password reset request"
        body={`Someone asked to reset your ${appName} password. If that was you, use the button below — the link expires in 1 hour. If not, you can ignore this email and your password stays the same.`}
        cta={{ label: "Reset password", href: url }}
      >
        <Text style={{ ...emailStyles.subtext, fontSize: 12, marginTop: 16 }}>
          Manual link:
        </Text>
        <Text style={{ ...emailStyles.subtext, fontSize: 12, wordBreak: "break-all" }}>
          {url}
        </Text>
      </MessageCard>
    </BaseEmail>
  );
}
