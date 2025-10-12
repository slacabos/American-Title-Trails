// Translation index - automatically exports all available languages
import en from './en.json';

export const translations = {
  en,
};

export const availableLanguages = Object.keys(translations) as Array<keyof typeof translations>;

export default translations;