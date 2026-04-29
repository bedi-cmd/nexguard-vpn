import { Section, Text } from "@react-email/components";
import { BaseEmail } from "./_layout";
import { MessageCard, emailStyles } from "./_components";

interface Props {
  name?: string | null;
  appUrl: string;
  appName: string;
}

export default function WelcomeEmail({ name, appUrl, appName }: Props) {
  const greeting = name ? `Welcome, ${name}` : `Welcome to ${appName}`;
  return (
    <BaseEmail preview={`${greeting} — let's get you set up`}>
      <MessageCard
        title={greeting}
        body="Your account is ready. Here's the 60-second setup so you're protected on every device."
        cta={{ label: "Open dashboard", href: `${appUrl}/dashboard` }}
        secondaryCta={{ label: "Browse plans", href: `${appUrl}/pricing` }}
      >
        <Section style={{ marginTop: 16, marginBottom: 16 }}>
          <Text style={{ ...emailStyles.subtext, marginBottom: 8 }}>1. Pick a plan</Text>
          <Text style={{ ...emailStyles.subtext, marginBottom: 8 }}>2. Download the app for your device</Text>
          <Text style={{ ...emailStyles.subtext, marginBottom: 0 }}>3. Connect, then forget about it</Text>
        </Section>
      </MessageCard>
    </BaseEmail>
  );
}
