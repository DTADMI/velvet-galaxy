import { expect, test } from "@playwright/test";

/**
 * Tests de regression visuelle.
 *
 * Pourquoi ils existent : les tests fonctionnels verifient qu'une page repond,
 * pas qu'elle reste LISIBLE. Une mise en page cassee (element qui chevauche un
 * autre, bouton rogne) passe tous les tests de comportement sans etre vue.
 *
 * Regles de stabilite, parce qu'un test visuel instable est pire qu'aucun test :
 *  - les animations et transitions sont desactivees ;
 *  - le contenu qui varie (dates, compteurs, avatars) est masque ;
 *  - une tolerance de pixels est acceptee pour les differences de rendu de police.
 *
 * Les references (dossier `__screenshots__`) sont a committer : sans elles, la
 * comparaison n'a pas de sens sur une autre machine.
 */

const PUBLIC_PAGES = [
  { path: "/", name: "accueil" },
  { path: "/about", name: "a-propos" },
  { path: "/terms", name: "conditions" },
  { path: "/privacy", name: "confidentialite" },
  { path: "/auth/signin", name: "connexion" },
  { path: "/auth/signup", name: "inscription" },
];

test.beforeEach(async ({ page }) => {
  // Desactiver les animations : une image prise a mi-transition ne veut rien dire.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      caret-color: transparent !important;
    }`,
  });
});

test.describe("Regression visuelle des pages publiques", () => {
  for (const { path, name } of PUBLIC_PAGES) {
    test(`${name} (${path})`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      // Masquer ce qui varie d'une execution a l'autre.
      await page.addStyleTag({
        content: `[data-testid="timestamp"], time, .animate-pulse { visibility: hidden !important; }`,
      });
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }

  test("accueil a 320 px : aucun defilement horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    // Controle de mise en page qui ne depend pas d'une image de reference : il
    // echoue meme sans capture enregistree.
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth };
    });
    expect(
      overflow.scrollWidth,
      `defilement horizontal a 320 px : ${overflow.scrollWidth} > ${overflow.clientWidth}`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
