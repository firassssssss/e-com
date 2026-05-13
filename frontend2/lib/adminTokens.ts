export type AdminTokens = {
  bg: string; panel: string; panelB: string;
  border: string; text: string; muted: string; dim: string;
  orange: string; cyan: string; green: string;
  red: string; redBg: string; yellow: string; purple: string;
  font: string; mono: string;
}

export function getD(dark: boolean): AdminTokens {
  if (dark) return {
    bg: "#0A0A0F", panel: "#111118", panelB: "#16161f",
    border: "rgba(255,255,255,0.07)", text: "#fff",
    muted: "rgba(255,255,255,0.5)", dim: "rgba(255,255,255,0.22)",
    orange: "#FF5F1F", cyan: "#00FFFF", green: "#00FFAA",
    red: "rgba(255,80,80,0.85)", redBg: "rgba(255,80,80,0.08)",
    yellow: "#FFD700", purple: "#9B59FF",
    font: "'Syncopate', sans-serif", mono: "monospace",
  }
  return {
    bg: "#F4F4F8", panel: "#FFFFFF", panelB: "#EBEBF2",
    border: "rgba(0,0,0,0.09)", text: "#0F0F1A",
    muted: "rgba(0,0,0,0.52)", dim: "rgba(0,0,0,0.28)",
    orange: "#E84D0E", cyan: "#0077AA", green: "#007A55",
    red: "rgba(200,40,40,0.9)", redBg: "rgba(200,40,40,0.07)",
    yellow: "#9A6E00", purple: "#5C2DB8",
    font: "'Syncopate', sans-serif", mono: "monospace",
  }
}
