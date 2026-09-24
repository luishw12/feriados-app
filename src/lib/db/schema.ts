import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const;
export const SCOPES = ['national', 'state', 'municipal'] as const;
export const KINDS = ['feriado', 'facultativo', 'comemorativa'] as const;
export const STATUSES = ['verified', 'unverified', 'incomplete'] as const;
export const CATEGORIES = ['religioso', 'historico', 'civico', 'cultural', 'social'] as const;
export const SUGGESTION_TYPES = ['new', 'edit', 'remove', 'other'] as const;
export const SUGGESTION_STATUSES = ['pending', 'approved', 'rejected', 'spam'] as const;

export type Region = (typeof REGIONS)[number];
export type Scope = (typeof SCOPES)[number];
export type Kind = (typeof KINDS)[number];
export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type SuggestionType = (typeof SUGGESTION_TYPES)[number];
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

const now = sql`(unixepoch() * 1000)`;

export const states = sqliteTable('states', {
  uf: text('uf').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  region: text('region', { enum: REGIONS }).notNull(),
  capitalIbge: integer('capital_ibge').notNull(),
});

export const municipalities = sqliteTable(
  'municipalities',
  {
    ibge: integer('ibge').primaryKey(),
    uf: text('uf')
      .notNull()
      .references(() => states.uf),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    capital: integer('capital', { mode: 'boolean' }).notNull().default(false),
    lat: real('lat'),
    lng: real('lng'),
  },
  (t) => [uniqueIndex('municipalities_uf_slug').on(t.uf, t.slug)],
);

export const holidays = sqliteTable(
  'holidays',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    scope: text('scope', { enum: SCOPES }).notNull(),
    uf: text('uf').references(() => states.uf),
    ibge: integer('ibge').references(() => municipalities.ibge),
    kind: text('kind', { enum: KINDS }).notNull(),
    rule: text('rule').notNull(),
    validFrom: integer('valid_from'),
    validTo: integer('valid_to'),
    categories: text('categories', { mode: 'json' }).$type<Category[]>().notNull().default(sql`'[]'`),
    summary: text('summary').notNull().default(''),
    body: text('body').notNull().default(''),
    legalBasis: text('legal_basis').notNull().default(''),
    sourceUrl: text('source_url').notNull().default(''),
    status: text('status', { enum: STATUSES }).notNull().default('unverified'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now),
  },
  (t) => [index('holidays_scope').on(t.scope), index('holidays_uf').on(t.uf), index('holidays_ibge').on(t.ibge)],
);

export const holidayOverrides = sqliteTable(
  'holiday_overrides',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    holidayId: text('holiday_id')
      .notNull()
      .references(() => holidays.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    /** MM-DD da data transferida; null = não ocorre nesse ano. */
    date: text('date'),
    note: text('note').notNull().default(''),
  },
  (t) => [uniqueIndex('holiday_overrides_holiday_year').on(t.holidayId, t.year)],
);

export const redirects = sqliteTable('redirects', {
  fromPath: text('from_path').primaryKey(),
  toPath: text('to_path').notNull(),
});

export interface SuggestionPayload {
  name?: string;
  rule?: string;
  kind?: Kind;
  scope?: Scope;
  summary?: string;
  legalBasis?: string;
}

export const suggestions = sqliteTable(
  'suggestions',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: SUGGESTION_TYPES }).notNull(),
    holidayId: text('holiday_id').references(() => holidays.id, { onDelete: 'set null' }),
    uf: text('uf'),
    ibge: integer('ibge'),
    payload: text('payload', { mode: 'json' }).$type<SuggestionPayload>().notNull(),
    snapshot: text('snapshot', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    message: text('message').notNull().default(''),
    sourceUrl: text('source_url').notNull().default(''),
    contributorName: text('contributor_name'),
    contributorLink: text('contributor_link'),
    contributorEmail: text('contributor_email'),
    ipHash: text('ip_hash').notNull(),
    status: text('status', { enum: SUGGESTION_STATUSES }).notNull().default('pending'),
    reviewNote: text('review_note').notNull().default(''),
    reviewedBy: text('reviewed_by'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
  },
  (t) => [index('suggestions_status').on(t.status, t.createdAt)],
);

export const revisions = sqliteTable(
  'revisions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    holidayId: text('holiday_id').notNull(),
    action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
    before: text('before', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    after: text('after', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    suggestionId: text('suggestion_id').references(() => suggestions.id, { onDelete: 'set null' }),
    author: text('author').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
  },
  (t) => [index('revisions_holiday').on(t.holidayId, t.createdAt)],
);

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  login: text('login').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url').notNull().default(''),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
});

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  windowStart: integer('window_start').notNull(),
});

export type StateRow = typeof states.$inferSelect;
export type MunicipalityRow = typeof municipalities.$inferSelect;
export type HolidayRow = typeof holidays.$inferSelect;
export type HolidayInsert = typeof holidays.$inferInsert;
export type OverrideRow = typeof holidayOverrides.$inferSelect;
export type SuggestionRow = typeof suggestions.$inferSelect;
export type RevisionRow = typeof revisions.$inferSelect;
