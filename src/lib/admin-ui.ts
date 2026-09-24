import type { Status, SuggestionStatus } from '@/lib/db/schema';

/** Rótulos e cores dos status no painel. As classes usam só os tokens semânticos. */
export const SUGGESTION_STATUS_UI: Record<SuggestionStatus, { tab: string; label: string; dot: string; chip: string }> = {
  pending: { tab: 'Pendentes', label: 'Pendente', dot: 'bg-warn', chip: 'bg-warn-soft text-warn' },
  approved: { tab: 'Aprovadas', label: 'Aprovada', dot: 'bg-ok', chip: 'bg-ok/12 text-ok' },
  rejected: { tab: 'Rejeitadas', label: 'Rejeitada', dot: 'bg-danger', chip: 'bg-danger/12 text-danger' },
  spam: { tab: 'Spam', label: 'Spam', dot: 'bg-faint', chip: 'bg-subtle text-muted' },
};

export const HOLIDAY_STATUS_CHIP: Record<Status, string> = {
  verified: 'bg-ok/12 text-ok',
  unverified: 'bg-subtle text-muted ring-1 ring-inset ring-line-strong',
  incomplete: 'bg-warn-soft text-warn',
};

/** Iniciais para o avatar quando não há foto. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
