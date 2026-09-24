import { expect, test } from '@playwright/test';

test('home mostra o calendário nacional e o próximo feriado', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Feriados');
  await expect(page.getByText('Próximo feriado').first()).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();
});

test('página de cidade lista feriados municipais e tem JSON-LD', async ({ page }) => {
  await page.goto('/rs/porto-alegre/');
  await expect(page.locator('h1')).toContainText('Porto Alegre');
  await expect(page.getByText('Nossa Senhora dos Navegantes').first()).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((t) => t.includes('"CollectionPage"'))).toBe(true);
});

test('página de feriado responde a data do ano', async ({ page }) => {
  await page.goto('/feriado/carnaval/2027/');
  await expect(page.locator('h1')).toHaveText(/Carnaval 2027/);
  await expect(page.getByText('9 de fevereiro').first()).toBeVisible();
});

test('versão markdown para IA', async ({ request }) => {
  const res = await request.get('/sp/sao-paulo.md');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/markdown');
  expect(await res.text()).toContain('# Feriados em São Paulo (SP)');
});

test('redirects 301 das URLs antigas', async ({ request }) => {
  for (const [from, to] of [
    ['/sao-paulo/campinas/', '/sp/campinas/'],
    ['/feriado/carnaval-terca/', '/feriado/carnaval/'],
    ['/guia/feriados-dias-uteis/', '/calculadora-dias-uteis/'],
  ]) {
    const res = await request.get(from!, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(new URL(res.headers()['location']!, 'http://x').pathname).toBe(to);
  }
});

test('API v1 devolve feriados da cidade', async ({ request }) => {
  const res = await request.get('/api/v1/feriados/2026/?ibge=3550308');
  const body = (await res.json()) as { local: { cidade: string }; feriados: { id: string; data: string }[] };
  expect(body.local.cidade).toBe('São Paulo');
  expect(body.feriados.some((f) => f.data === '2026-01-25')).toBe(true);
});

test('busca encontra cidade pelo teclado', async ({ page }) => {
  await page.goto('/');
  // a ilha de busca hidrata em client:idle
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="SearchDialog"][ssr]'));
  await page.keyboard.press('/');
  await page.keyboard.type('campinas');
  await expect(page.locator('#search-results a').first()).toContainText('Campinas');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/sp\/campinas\/$/);
});

test('sugestão → aprovação no painel → página atualizada', async ({ page, request }) => {
  const name = `Feriado de Teste ${Date.now()}`;
  await page.goto('/ac/acrelandia/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sugerir feriado' }).click();
  await expect(page.locator('#sg-place-value')).toContainText('Acrelândia');
  await page.fill('#sg-name', name);
  await page.click('#sg-date');
  for (let i = 0; i < 12 && (await page.locator('#sg-date-month').textContent()) !== 'julho'; i++) {
    await page.getByRole('button', { name: 'Próximo mês' }).click();
  }
  await page.getByRole('button', { name: '14 de julho' }).click();
  await expect(page.locator('#sg-date')).toContainText('14 de julho');
  await page.getByRole('button', { name: 'Enviar sugestão' }).click();
  await expect(page.getByText('Obrigado pela contribuição')).toBeVisible();

  await page.goto('/admin/login/');
  await page.getByRole('button', { name: /modo desenvolvimento/ }).click();
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await page.getByRole('button', { name: 'Aprovar e publicar' }).click();
  await expect(page).toHaveURL(/\/admin\/sugestoes\/\?ok=1/);

  const html = await (await request.get('/ac/acrelandia/')).text();
  expect(html).toContain(name);
});

test('sugestão sem contexto vincula a cidade pela busca', async ({ page }) => {
  await page.goto('/contribuir/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sugerir sem contexto' }).click();
  await page.getByRole('button', { name: 'Enviar sugestão' }).click();
  await expect(page.getByText('Escolha a cidade, o estado ou “Nacional”.')).toBeVisible();
  await page.fill('#sg-place', 'acrelandia');
  await page.getByRole('option', { name: /Acrelândia/ }).click();
  await expect(page.locator('#sg-place-value')).toContainText('Acrelândia · AC');
  await page.getByRole('button', { name: 'Trocar' }).click();
  await page.fill('#sg-place', 'brasil');
  await page.keyboard.press('Enter');
  await expect(page.locator('#sg-place-value')).toContainText('Nacional');
});

test('painel: cria feriado municipal com busca de cidade e regra da Páscoa', async ({ page }) => {
  const name = `Teste Painel ${Date.now()}`;
  await page.goto('/admin/login/');
  await page.getByRole('button', { name: /modo desenvolvimento/ }).click();
  await page.goto('/admin/feriados/novo/');
  await page.fill('#hf-name', name);
  await page.getByText('Páscoa', { exact: true }).click();
  await page.selectOption('#rb-easter', '60');
  await page.getByText('Municipal', { exact: true }).click();
  await page.fill('#sp-place', 'acrelandia');
  await page.getByRole('option', { name: /Acrelândia/ }).click();
  await page.getByRole('button', { name: 'Criar e publicar' }).click();
  await expect(page).toHaveURL(/salvo=1/);
  await expect(page.locator('input[name="rule"]')).toHaveValue('easter:+60');
  await expect(page.locator('input[name="ibge"]')).toHaveValue('1200013');
});
