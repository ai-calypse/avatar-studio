import { test, expect } from '@playwright/test';

test('every supported studio locale covers text, options, tooltips, and accessible names', async ({page}) => {
  await page.goto('/demo/?lang=en', {waitUntil:'networkidle'});
  const locales = await page.evaluate(async () => (await import('/demo/avatar-studio-i18n.js')).supportedLanguages);
  for (const locale of locales.filter(locale => locale !== 'en')) {
    await page.locator('.studio-language').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    const missing = await page.evaluate(async language => {
      const {missingStudioTranslations,translations} = await import('/demo/avatar-studio-i18n.js');
      const canonical = Object.keys(translations.es);
      return {catalog:canonical.filter(key => !translations[language][key]),
        page:missingStudioTranslations(document.querySelector('.studio-shell'),language)};
    },locale);
    expect(missing,locale).toEqual({catalog:[],page:[]});
    await expect(page.locator('.studio-language')).not.toHaveAttribute('aria-label','Page language');
    await expect(page.locator('[data-avatar-showcase]').first()).not.toHaveAttribute('alt','Your avatar as a chat profile');
  }
  await page.locator('.studio-language').selectOption('en');
  await expect(page.locator('.studio-language')).toHaveAttribute('aria-label','Page language');
});

test('dynamic export feedback translates when overwritten and languages switch', async ({page})=>{
  await page.goto('/demo/?lang=es', {waitUntil:'networkidle'});
  await page.getByRole('button',{name:'SVG',exact:false}).click();
  await expect(page.locator('#export-status')).toHaveText('Tu SVG está listo. Siéntete en casa en cualquier lugar.');
  await page.locator('.studio-language').selectOption('fr');
  await expect(page.locator('#export-status')).not.toContainText('Tu SVG');
  await page.locator('.studio-language').selectOption('en');
  await expect(page.locator('#export-status')).toHaveText('Your SVG is ready. Make yourself at home anywhere.');
});
