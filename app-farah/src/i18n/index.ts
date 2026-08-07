import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import ar from './locales/ar';
import en from './locales/en';

const LOCALE_PERSISTENCE_KEY = 'language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LOCALE_PERSISTENCE_KEY);
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      const deviceLang = getLocales()[0]?.languageCode;
      return callback(deviceLang === 'ar' ? 'ar' : 'en');
    } catch (error) {
      console.log('Error reading language', error);
      return callback('ar');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LOCALE_PERSISTENCE_KEY, lng);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export const changeLanguage = async (lng: 'ar' | 'en') => {
  await i18n.changeLanguage(lng);
  const isRTL = lng === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);
    // Restart logic is usually handled on the component side or using expo-updates
  }
};

export default i18n;
