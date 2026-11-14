export interface TickerConfig {
  id: string;
  name: string;
  badge: string;
  messages: string[];
  speed: 'slow' | 'normal' | 'fast';
  theme: 'blue' | 'red' | 'dark' | 'emerald' | 'amber';
  fontSize: number;
  backgroundColor?: string;
  textColor?: string;
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  borderColor?: string;
  borderRadius?: number;
  createdAt?: string;
}

export const THEME_STYLES: Record<string, { bg: string; text: string; badgeBg: string; badgeText: string }> = {
  blue: { bg: '#1e3a8a', text: '#ffffff', badgeBg: '#3b82f6', badgeText: '#ffffff' },
  red: { bg: '#991b1b', text: '#ffffff', badgeBg: '#ef4444', badgeText: '#ffffff' },
  dark: { bg: '#111827', text: '#f3f4f6', badgeBg: '#374151', badgeText: '#f9fafb' },
  emerald: { bg: '#065f46', text: '#ffffff', badgeBg: '#10b981', badgeText: '#ffffff' },
  amber: { bg: '#92400e', text: '#ffffff', badgeBg: '#f59e0b', badgeText: '#000000' },
};

export const SPEED_SECONDS: Record<string, number> = {
  slow: 25,
  normal: 15,
  fast: 8,
};
