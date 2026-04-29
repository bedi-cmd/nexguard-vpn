import { Button as REButton, Section, Text, Heading } from "@react-email/components";
import { COLOR } from "./_layout";

const card: React.CSSProperties = {
  background: COLOR.card,
  border: `1px solid ${COLOR.border}`,
  borderRadius: 12,
  padding: 28,
};

const heading: React.CSSProperties = {
  color: COLOR.text,
  fontSize: 24,
  margin: "0 0 8px",
  letterSpacing: "-0.02em",
};

const subtext: React.CSSProperties = {
  color: COLOR.textMuted,
  fontSize: 14,
  margin: "0 0 24px",
  lineHeight: 1.6,
};

const buttonStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${COLOR.brandBlue}, ${COLOR.brandCyan})`,
  color: "#0a0a1a",
  fontWeight: 600,
  padding: "12px 22px",
  borderRadius: 8,
  display: "inline-block",
  textDecoration: "none",
};

const buttonOutline: React.CSSProperties = {
  background: "transparent",
  color: COLOR.text,
  border: `1px solid ${COLOR.border}`,
  fontWeight: 600,
  padding: "11px 21px",
  borderRadius: 8,
  display: "inline-block",
  textDecoration: "none",
};

const codeStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  color: COLOR.brandCyan,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 13,
  padding: "2px 6px",
  borderRadius: 4,
};

interface CardProps {
  title: string;
  body: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  children?: React.ReactNode;
}

export function MessageCard({ title, body, cta, secondaryCta, children }: CardProps) {
  return (
    <Section style={card}>
      <Heading as="h1" style={heading}>{title}</Heading>
      <Text style={subtext}>{body}</Text>
      {children}
      {/* Each CTA renders in its own block-level section so they always stack
          vertically with a 16px gap — reliable across Outlook/Gmail/clients
          that ignore flex or row gaps. */}
      {cta && (
        <Section style={{ marginTop: 8 }}>
          <REButton href={cta.href} style={buttonStyle}>
            {cta.label}
          </REButton>
        </Section>
      )}
      {secondaryCta && (
        <Section style={{ marginTop: 16 }}>
          <REButton href={secondaryCta.href} style={buttonOutline}>
            {secondaryCta.label}
          </REButton>
        </Section>
      )}
    </Section>
  );
}

export const emailStyles = {
  card,
  heading,
  subtext,
  buttonStyle,
  buttonOutline,
  codeStyle,
};
