// Help content index - automatically exports all available languages
import { helpContent as en } from "./en";

export const helpContent = {
  en,
};

export const availableHelpLanguages = Object.keys(helpContent) as Array<
  keyof typeof helpContent
>;

export default helpContent;
