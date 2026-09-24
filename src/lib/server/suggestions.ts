import { z } from 'astro/zod';
import { KINDS, SUGGESTION_TYPES } from '../db/schema';
import { isValidRule } from '../holidays/rules';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^https?:\/\/[^\s]+\.[^\s]+/.test(v), 'Link inválido');

export const suggestionInput = z
  .object({
    type: z.enum(SUGGESTION_TYPES),
    holidayId: optionalText(160),
    uf: z
      .string()
      .regex(/^[A-Za-z]{2}$/)
      .optional()
      .transform((v) => v?.toUpperCase()),
    ibge: z.number().int().min(1_000_000).max(9_999_999).optional(),
    placeText: optionalText(120),
    proposal: z
      .object({
        name: optionalText(120),
        rule: optionalText(20).refine((v) => v === undefined || isValidRule(v), 'Data inválida'),
        kind: z.enum(KINDS).optional(),
      })
      .prefault({}),
    message: z.string().trim().max(2000).default(''),
    sourceUrl: optionalUrl,
    contributorName: optionalText(80),
    contributorLink: optionalUrl,
    contributorEmail: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'E-mail inválido'),
    website: z.string().max(200).optional(),
    turnstileToken: z.string().max(4000).default(''),
    page: optionalText(200),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'new') {
      if (!value.proposal.name || value.proposal.name.length < 3) ctx.addIssue({ code: 'custom', message: 'Informe o nome do feriado' });
      if (!value.proposal.rule) ctx.addIssue({ code: 'custom', message: 'Informe a data' });
      if (!value.ibge && !value.uf && !value.placeText) ctx.addIssue({ code: 'custom', message: 'Informe onde o feriado vale' });
    }
    if (value.type === 'edit') {
      if (!value.holidayId) ctx.addIssue({ code: 'custom', message: 'Feriado não informado' });
      const hasChange = Object.values(value.proposal).some(Boolean);
      if (!hasChange && value.message.length < 5) ctx.addIssue({ code: 'custom', message: 'Diga o que precisa ser corrigido' });
    }
    if ((value.type === 'remove' || value.type === 'other') && value.message.length < 5) {
      ctx.addIssue({ code: 'custom', message: 'Escreva uma mensagem explicando' });
    }
    if (value.type === 'remove' && !value.holidayId) ctx.addIssue({ code: 'custom', message: 'Feriado não informado' });
  });

export type SuggestionInput = z.infer<typeof suggestionInput>;

export const SUGGESTION_TYPE_LABEL: Record<(typeof SUGGESTION_TYPES)[number], string> = {
  new: 'Novo feriado',
  edit: 'Correção',
  remove: 'Remoção',
  other: 'Outro',
};
