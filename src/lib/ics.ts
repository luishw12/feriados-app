import type { Place } from './data';
import type { Occurrence } from './holidays/resolve';
import { addDays } from './holidays/rules';
import { SITE_NAME, paths, placeLabel, typeLabel } from './site';

function escape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Quebra linhas em 75 octetos (RFC 5545). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    if (new TextEncoder().encode(current + char).length > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = char;
    } else current += char;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function buildIcs(place: Place, occurrences: Occurrence[], site: URL): string {
  const name = `Feriados — ${placeLabel(place)}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const host = site.hostname;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${SITE_NAME}//${host}//PT-BR`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escape(name)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo',
    `X-WR-CALDESC:${escape(`Feriados de ${placeLabel(place)}, atualizados automaticamente por ${SITE_NAME}.`)}`,
    'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    'X-PUBLISHED-TTL:P1D',
  ];
  for (const o of occurrences) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${o.id}-${o.date}@${host}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${o.date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${addDays(o.date, 1).replace(/-/g, '')}`,
      `SUMMARY:${escape(o.kind === 'feriado' ? o.name : `${o.name} (${typeLabel(o.scope, o.kind).toLowerCase()})`)}`,
      `DESCRIPTION:${escape(`${typeLabel(o.scope, o.kind)}.${o.summary ? ` ${o.summary}` : ''}`)}`,
      `URL:${new URL(paths.holiday(o.id, Number(o.date.slice(0, 4))), site).href}`,
      'TRANSP:TRANSPARENT',
      `CATEGORIES:${escape(typeLabel(o.scope, o.kind))}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
