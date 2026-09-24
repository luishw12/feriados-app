/** Localização do visitante: última cidade vista (localStorage) ou palpite por IP (/api/geo/). */
export interface SavedLocation {
  uf: string;
  slug: string;
  name: string;
}

const KEY = 'location';

export function readLocation(): SavedLocation | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null') as SavedLocation | null;
    return value && value.uf && value.slug && value.name ? value : null;
  } catch {
    return null;
  }
}

export function saveLocation(location: SavedLocation): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(location));
  } catch {
    /* modo privado etc. */
  }
}

export async function suggestLocation(): Promise<void> {
  const button = document.getElementById('geo-suggestion');
  const label = button?.querySelector('span');
  if (!button || !label) return;
  let location = readLocation();
  let guessed = false;
  if (!location) {
    const response = await fetch('/api/geo/').catch(() => null);
    const data = response?.ok ? ((await response.json()) as Partial<SavedLocation> | null) : null;
    if (data?.uf && data.slug && data.name) {
      location = { uf: data.uf, slug: data.slug, name: data.name };
      guessed = true;
    }
  }
  if (!location) return;
  button.setAttribute('href', `/${location.uf.toLowerCase()}/${location.slug}/`);
  label.textContent = guessed ? `Está em ${location.name}? Ver feriados` : `Feriados de ${location.name} (${location.uf})`;
  button.classList.remove('hidden');
}
