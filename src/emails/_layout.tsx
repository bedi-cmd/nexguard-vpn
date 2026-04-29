import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Props {
  preview: string;
  children: React.ReactNode;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "NexGuard";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const COLOR = {
  bg: "#0a0a1a",
  card: "#11112a",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  brandBlue: "#3b82f6",
  brandCyan: "#22d3ee",
  border: "rgba(59,130,246,0.18)",
  borderSoft: "rgba(255,255,255,0.06)",
};

export function BaseEmail({ preview, children }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Link href={APP_URL} style={brand}>
              <span style={{ ...brand, fontWeight: 700 }}>Nex</span>
              <span style={{ ...brand, fontWeight: 700, color: COLOR.brandCyan }}>Guard</span>
            </Link>
          </Section>

          {children}

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              {APP_NAME} · Your Shield in the Digital World
            </Text>
            <Text style={footerText}>
              <Link style={footerLink} href={`${APP_URL}/dashboard/support`}>
                Support
              </Link>
              {" · "}
              <Link style={footerLink} href={`${APP_URL}/legal/privacy`}>
                Privacy
              </Link>
              {" · "}
              <Link style={footerLink} href={`${APP_URL}/legal/terms`}>
                Terms
              </Link>
            </Text>
            <Text style={{ ...footerText, color: COLOR.textDim }}>
              You received this because you have a {APP_NAME} account. If this wasn&apos;t you,
              ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ───── Style tokens ─────

const body: React.CSSProperties = {
  backgroundColor: COLOR.bg,
  color: COLOR.text,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 12px",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: 560,
  padding: 0,
};

const header: React.CSSProperties = {
  padding: "0 0 16px",
};

const brand: React.CSSProperties = {
  fontSize: 18,
  letterSpacing: "-0.01em",
  textDecoration: "none",
  color: COLOR.text,
};

const hr: React.CSSProperties = {
  borderColor: COLOR.borderSoft,
  margin: "32px 0 16px",
};

const footer: React.CSSProperties = {
  padding: 0,
};

const footerText: React.CSSProperties = {
  color: COLOR.textMuted,
  fontSize: 12,
  margin: "4px 0",
  lineHeight: 1.5,
};

const footerLink: React.CSSProperties = {
  color: COLOR.brandCyan,
  textDecoration: "none",
};
