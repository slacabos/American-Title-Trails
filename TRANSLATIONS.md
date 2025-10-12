# Translations System

This document explains how to use the internationalization (i18n) system in American Title Trails.

## Overview

The game uses a JSON-based translation system that allows for easy localization into different languages. All user-facing strings are stored in `src/translations.json` and accessed through the `useTranslations` hook.

## Files Structure

```
src/
├── translations.json          # All translation strings
├── hooks/
│   └── useTranslations.ts     # Translation hook
├── types/
│   └── json.d.ts             # Type declarations for JSON imports
└── examples/
    └── translation-usage.ts   # Usage examples
```

## Usage

### 1. Import the hook

```tsx
import useTranslations from "../hooks/useTranslations";
```

### 2. Use in your component

```tsx
const { t } = useTranslations();

// Simple translation
<h1>{t('app.title')}</h1>

// Translation with variables
<p>{t('messages.placedTile', { playerName: 'John', x: 5, y: 3 })}</p>
```

## Translation Keys Structure

The translations are organized hierarchically:

- `app.*` - Application-level strings (title, tagline)
- `setup.*` - Game setup screen strings
- `game.*` - Main game interface strings
- `features.*` - Feature claiming strings
- `gameOver.*` - Game over screen strings
- `scoreboard.*` - Player scores and stats
- `activityLog.*` - Activity log strings
- `quickGuide.*` - Quick reference guide
- `messages.*` - User feedback messages
- `errors.*` - Error messages
- `help.*` - Comprehensive help documentation

## Examples

### Basic Usage

```tsx
// Before
<h2>Game Setup</h2>

// After
<h2>{t('setup.gameSetup')}</h2>
```

### With Variables

```tsx
// Before
<p>You have {followers} followers remaining.</p>

// After
<p>{t('features.claimHint', { followers })}</p>
```

### Player Names

```tsx
// Before
name: i === 0 ? "You" : `Player ${i + 1}`;

// After
name: i === 0
  ? t("setup.defaultPlayerName")
  : t("setup.defaultPlayerNameTemplate", { number: i + 1 });
```

### Log Messages

```tsx
// Before
addLog(`${playerName} placed tile at (${x}, ${y})`);

// After
addLog(t("messages.placedTile", { playerName, x, y }));
```

## Adding New Languages

To add a new language (e.g., Spanish):

1. Add the language code to the `translations.json`:

```json
{
  "en": {
    /* existing English translations */
  },
  "es": {
    "app": {
      "title": "Senderos de Azulejos Americanos",
      "tagline": "Abadías de McDonald's, castillos de Costco y carreteras transcontinentales."
    }
    // ... rest of Spanish translations
  }
}
```

2. Update the `Language` type in `useTranslations.ts`:

```typescript
type Language = "en" | "es";
```

3. Add language selection UI:

```tsx
const { changeLanguage, availableLanguages } = useTranslations();

<select onChange={(e) => changeLanguage(e.target.value as Language)}>
  {availableLanguages.map((lang) => (
    <option key={lang} value={lang}>
      {lang.toUpperCase()}
    </option>
  ))}
</select>;
```

## Variable Interpolation

The system supports variable substitution using `{variableName}` syntax:

```json
{
  "messages": {
    "placedTile": "{playerName} placed tile at ({x}, {y})",
    "featuresCompleted": "{count} features completed!"
  }
}
```

Usage:

```tsx
t("messages.placedTile", { playerName: "Alice", x: 1, y: 2 });
// Result: "Alice placed tile at (1, 2)"
```

## Best Practices

1. **Use semantic keys**: Prefer `setup.gameSetup` over `labels.gameSetup`
2. **Group related strings**: Keep UI sections together in the hierarchy
3. **Include context in variables**: Use descriptive variable names like `{playerName}` not `{name}`
4. **Maintain consistency**: Use the same variable names across similar messages
5. **Test thoroughly**: Verify that variable substitution works correctly
6. **Handle missing translations**: The hook will warn about missing keys and return the key as fallback

## Migration Strategy

To migrate existing components:

1. Identify all hardcoded strings
2. Add corresponding entries to `translations.json`
3. Replace strings with `t()` calls
4. Test that the UI still works correctly
5. Check console for any missing translation warnings

## Performance Considerations

- Translations are loaded once and cached
- The `t()` function is memoized with `useCallback`
- No network requests are made after initial load
- Consider lazy loading for large translation files

## Development Tips

- Use browser dev tools to search for hardcoded strings
- Add console warnings for missing translations during development
- Consider using TypeScript string literal types for translation keys in larger projects
- Test with longer translations to ensure UI layouts remain functional
