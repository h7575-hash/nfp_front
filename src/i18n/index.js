import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 日本語リソース
import jaCommon from '../locales/ja/common.json';
import jaPages from '../locales/ja/pages.json';

// 英語リソース
import enCommon from '../locales/en/common.json';
import enPages from '../locales/en/pages.json';

const resources = {
  ja: {
    common: jaCommon,
    pages: jaPages,
  },
  en: {
    common: enCommon,
    pages: enPages,
  },
};

i18n
  .use(LanguageDetector) // ブラウザの言語を自動検出
  .use(initReactI18next) // React用の初期化
  .init({
    resources,
    fallbackLng: 'ja', // フォールバック言語
    debug: process.env.NODE_ENV === 'development',

    // 名前空間の設定
    ns: ['common', 'pages'],
    defaultNS: 'common',

    // キーが見つからない場合の処理
    keySeparator: '.',
    interpolation: {
      escapeValue: false, // Reactでは自動的にエスケープされる
    },

    // 言語検出の設定
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;