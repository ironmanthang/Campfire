import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import vi from "./locales/vi.json";

const LANGUAGE_STORAGE_KEY = "campfire_mobile_language";

const persistedLanguage =
  typeof localStorage !== "undefined"
    ? localStorage.getItem(LANGUAGE_STORAGE_KEY)
    : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi }
    },
    lng: persistedLanguage ?? "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
  }
}

export { LANGUAGE_STORAGE_KEY };

export default i18n;
