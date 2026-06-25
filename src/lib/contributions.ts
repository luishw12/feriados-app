export type ContributionMode = 'suggest_holiday' | 'report_error' | 'enrich_content';

export type HolidayScope = 'national' | 'state' | 'municipal';

export type SocialPlatform = 'LinkedIn' | 'Instagram' | 'X' | 'GitHub' | 'Outro';

export interface ContributionOpenDetail {
  mode: ContributionMode;
  holidayId?: string;
  holidayName?: string;
  pageUrl?: string;
}

export interface ContributionPayload {
  type: ContributionMode;
  holidayName?: string;
  holidayId?: string;
  pageUrl?: string;
  scope?: HolidayScope;
  state?: string;
  city?: string;
  date?: string;
  description?: string;
  message?: string;
  source: string;
  contributorName?: string;
  contributorSocialPlatform?: SocialPlatform;
  contributorSocialUrl?: string;
  website?: string;
}

export const OPEN_CONTRIBUTION_EVENT = 'open-contribution';

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'LinkedIn',
  'Instagram',
  'X',
  'GitHub',
  'Outro',
];

export const HOLIDAY_SCOPES: { value: HolidayScope; label: string }[] = [
  { value: 'national', label: 'Nacional' },
  { value: 'state', label: 'Estadual' },
  { value: 'municipal', label: 'Municipal' },
];

export const CONTRIBUTION_MODE_LABELS: Record<ContributionMode, string> = {
  suggest_holiday: 'Faltou algum feriado?',
  report_error: 'Informação incorreta',
  enrich_content: 'Enriquecer este artigo',
};

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateContribution(payload: ContributionPayload): string | null {
  if (isNonEmpty(payload.website)) {
    return null;
  }

  if (!isNonEmpty(payload.source)) {
    return 'Informe uma fonte oficial ou referência.';
  }

  const hasContributorName = isNonEmpty(payload.contributorName);
  const hasSocialPlatform = isNonEmpty(payload.contributorSocialPlatform);
  const hasSocialUrl = isNonEmpty(payload.contributorSocialUrl);

  if (hasContributorName || hasSocialPlatform || hasSocialUrl) {
    if (!hasContributorName) {
      return 'Informe seu nome para receber crédito na página.';
    }
    if (!hasSocialPlatform) {
      return 'Selecione uma rede social.';
    }
    if (!hasSocialUrl) {
      return 'Informe o link do seu perfil na rede social.';
    }
    if (!isValidUrl(payload.contributorSocialUrl)) {
      return 'O link da rede social deve ser uma URL válida (https://...).';
    }
  }

  if (payload.type === 'suggest_holiday') {
    if (!isNonEmpty(payload.holidayName)) {
      return 'Informe o nome do feriado.';
    }
    if (!payload.scope) {
      return 'Selecione o escopo do feriado.';
    }
    if (payload.scope !== 'national' && !isNonEmpty(payload.state)) {
      return 'Informe o estado (UF) do feriado.';
    }
    if (payload.scope === 'municipal' && !isNonEmpty(payload.city)) {
      return 'Informe a cidade do feriado.';
    }
    if (!isNonEmpty(payload.date)) {
      return 'Informe a data do feriado.';
    }
    return null;
  }

  if (!isNonEmpty(payload.holidayName)) {
    return 'Feriado não identificado.';
  }

  if (!isNonEmpty(payload.message)) {
    return payload.type === 'report_error'
      ? 'Descreva o que está incorreto.'
      : 'Descreva a informação que deseja adicionar.';
  }

  return null;
}

export function openContributionModal(detail: ContributionOpenDetail): void {
  window.dispatchEvent(new CustomEvent(OPEN_CONTRIBUTION_EVENT, { detail }));
}

export async function submitContribution(
  payload: ContributionPayload,
): Promise<{ ok: true; issueUrl: string } | { ok: false; error: string }> {
  const validationError = validateContribution(payload);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  if (isNonEmpty(payload.website)) {
    return { ok: true, issueUrl: '' };
  }

  try {
    const response = await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      if (typeof data === 'object' && data !== null && 'error' in data) {
        const record = data as Record<string, unknown>;
        if (typeof record.error === 'string') {
          return { ok: false, error: record.error };
        }
      }
      return { ok: false, error: 'Não foi possível enviar sua contribuição. Tente novamente.' };
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'ok' in data &&
      (data as Record<string, unknown>).ok === true &&
      'issueUrl' in data &&
      typeof (data as Record<string, unknown>).issueUrl === 'string'
    ) {
      return { ok: true, issueUrl: (data as Record<string, string>).issueUrl };
    }

    return { ok: true, issueUrl: '' };
  } catch {
    return { ok: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
  }
}
