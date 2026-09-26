# Translations

How user-facing text works in American Tile Trails, and what adding a language involves.

## Where text lives

```
src/
├── content/
│   ├── translations/
│   │   ├── en.json        # Every UI string
│   │   └── index.ts       # Registers each language's JSON
│   └── help/
│       ├── en.md          # Help screen text (edit this)
│       ├── en.ts          # Generated from en.md; don't edit by hand
│       └── index.ts       # Registers each language's help
└── hooks/
    └── useTranslations.ts # t(), with {placeholder} interpolation
```

English is the only language so far.

## Using strings

```tsx
import useTranslations from "@/hooks/useTranslations";

const { t } = useTranslations();

<h1>{t("app.title")}</h1>
<p>{t("messages.placedTile", { playerName: "Ada", x: 1, y: 2 })}</p>
// "Ada placed tile at (1, 2)"
```

- Keys are dot paths into the JSON. Placeholders use `{name}`; a placeholder with no value is left as is.
- A missing key logs a console warning and shows the key itself, so gaps are easy to spot.
- `t` is stable between renders unless the language changes, so it's safe in dependency arrays.

The top-level groups in `en.json` are `app`, `setup`, `game`, `features`, `gameOver`, `scoreboard`, `activityLog`, `quickGuide`, `messages`, `errors`, `help`, `board`, `hud` and `shortcuts`. The in-game HUD mostly uses `hud`, `messages` and `shortcuts`; the setup screen uses `setup`.

## Adding or changing a string

1. Add the key to `src/content/translations/en.json`, in the group for that part of the UI.
2. Use `t("group.key")` in the component; never hard-code visible text.
3. Name placeholders by meaning: `{playerName}` rather than `{name}`, and reuse the same names across similar messages.

## Editing the help screen

Edit `src/content/help/en.md`, then regenerate the TypeScript module the app imports:

```bash
npm run sync-help-content               # English
node scripts/sync-help-content.js es    # Another language
```

Commit both the `.md` and the generated `.ts`.

## Adding a language

The file format is ready for more languages, but the app doesn't let you switch yet. For Spanish, for example:

1. **Strings:** copy `en.json` to `es.json`, translate the values (not the keys or placeholders), and register it in `src/content/translations/index.ts`.
2. **Help:** write `src/content/help/es.md`, run `node scripts/sync-help-content.js es`, and register it in `src/content/help/index.ts`.
3. **Language type:** `useTranslations.ts` declares `type Language = "en"`. Widen it, ideally by deriving it from the registered translations.
4. **Share the choice:** each `useTranslations()` call currently keeps its own `language` state, so `changeLanguage` only affects one component. Move the choice into shared state that's remembered. Follow the pattern the game already uses for day/night and sound (`src/rendering/timeOfDay.ts` + `src/hooks/useTimeOfDay.ts`): one `localStorage` key, plus a custom event that keeps every hook in sync. Default to the browser's language when it's supported.
5. **Help modal:** `HelpModal.tsx` always shows `helpContent.en`. Make it use the current language.
6. **Picker:** add a language control to the setup screen, and to the HUD if useful.
7. **Check lengths:** translations are often longer than English. Check the setup screen, the tile dock and the scoreboard in Storybook at phone width.

Some strings are built from parts, such as a feature type inside a claim label: `` t("hud.claim", { type: t(`hud.featureTypes.${type}`) }) ``. Check that the sentence still reads naturally in the new language, and give it its own key if it doesn't.
