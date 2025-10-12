import { useState, useCallback } from "react";
import { translations } from "../content/translations";

type Language = "en";
type TranslationKey = string;

// Helper function to get nested object value by dot notation
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

// Helper function to replace placeholders like {playerName}, {count}, etc.
function interpolateString(
  template: string,
  variables: Record<string, any> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

export function useTranslations() {
  const [language, setLanguage] = useState<Language>("en");

  const t = useCallback(
    (key: TranslationKey, variables?: Record<string, any>): string => {
      const translation = getNestedValue(translations[language], key);

      if (translation === null) {
        console.warn(`Translation missing for key: ${key}`);
        return key; // Return the key itself as fallback
      }

      if (typeof translation !== "string") {
        console.warn(
          `Translation for key "${key}" is not a string:`,
          translation
        );
        return key;
      }

      return variables
        ? interpolateString(translation, variables)
        : translation;
    },
    [language]
  );

  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
  }, []);

  return {
    t,
    language,
    changeLanguage,
    availableLanguages: Object.keys(translations) as Language[],
  };
}

export default useTranslations;
