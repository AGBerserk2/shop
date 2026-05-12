import { getConfig } from '../../../../../lib/util/getConfig.js';

export default {
  Setting: {
    storeName: (setting) => {
      const storeName = setting.find((s) => s.name === 'storeName');
      if (storeName) {
        return storeName.value;
      } else {
        return 'An Amazing EverShop Store';
      }
    },
    storeDescription: (setting) => {
      const storeDescription = setting.find(
        (s) => s.name === 'storeDescription'
      );
      if (storeDescription) {
        return storeDescription.value;
      } else {
        return 'An Amazing EverShop Store';
      }
    },
    storeLanguage: () => getConfig('shop.language', 'en'),
    storeCurrency: () => getConfig('shop.currency', 'USD'),
    storeTimeZone: (setting) => {
      const storeTimeZone = setting.find((s) => s.name === 'storeTimeZone');
      if (storeTimeZone) {
        return storeTimeZone.value;
      } else {
        return 'America/New_York';
      }
    },
    storePhoneNumber: (setting) => {
      const storePhoneNumber = setting.find(
        (s) => s.name === 'storePhoneNumber'
      );
      if (storePhoneNumber) {
        return storePhoneNumber.value;
      } else {
        return null;
      }
    },
    storeEmail: (setting) => {
      const storeEmail = setting.find((s) => s.name === 'storeEmail');
      if (storeEmail) {
        return storeEmail.value;
      } else {
        return null;
      }
    },
    storeCountry: (setting) => {
      const storeCountry = setting.find((s) => s.name === 'storeCountry');
      if (storeCountry) {
        return storeCountry.value;
      } else {
        return 'US';
      }
    },
    storeAddress: (setting) => {
      const storeAddress = setting.find((s) => s.name === 'storeAddress');
      if (storeAddress) {
        return storeAddress.value;
      } else {
        return null;
      }
    },
    storeCity: (setting) => {
      const storeCity = setting.find((s) => s.name === 'storeCity');
      if (storeCity) {
        return storeCity.value;
      } else {
        return null;
      }
    },
    storeProvince: (setting) => {
      const storeProvince = setting.find((s) => s.name === 'storeProvince');
      if (storeProvince) {
        return storeProvince.value;
      } else {
        return null;
      }
    },
    storePostalCode: (setting) => {
      const storePostalCode = setting.find((s) => s.name === 'storePostalCode');
      if (storePostalCode) {
        return storePostalCode.value;
      } else {
        return null;
      }
    },
    storeLogo: (setting) => {
      const storeLogo = setting.find((s) => s.name === 'storeLogo');
      return storeLogo ? storeLogo.value : null;
    },
    storeLogoAlt: (setting) => {
      const storeLogoAlt = setting.find((s) => s.name === 'storeLogoAlt');
      return storeLogoAlt ? storeLogoAlt.value : null;
    },
    storeInstagram: (setting) => {
      const r = setting.find((s) => s.name === 'storeInstagram');
      return r ? r.value : null;
    },
    storeFacebook: (setting) => {
      const r = setting.find((s) => s.name === 'storeFacebook');
      return r ? r.value : null;
    },
    storeWhatsapp: (setting) => {
      const r = setting.find((s) => s.name === 'storeWhatsapp');
      return r ? r.value : null;
    },
    storeTiktok: (setting) => {
      const r = setting.find((s) => s.name === 'storeTiktok');
      return r ? r.value : null;
    },
    storeTwitter: (setting) => {
      const r = setting.find((s) => s.name === 'storeTwitter');
      return r ? r.value : null;
    },
    helpLinkShipping: (setting) => {
      const r = setting.find((s) => s.name === 'helpLinkShipping');
      return r ? r.value : null;
    },
    helpLinkReturns: (setting) => {
      const r = setting.find((s) => s.name === 'helpLinkReturns');
      return r ? r.value : null;
    },
    helpLinkFaq: (setting) => {
      const r = setting.find((s) => s.name === 'helpLinkFaq');
      return r ? r.value : null;
    },
    helpLinkContact: (setting) => {
      const r = setting.find((s) => s.name === 'helpLinkContact');
      return r ? r.value : null;
    },
    storeNotificationFrom: (setting) => {
      const r = setting.find((s) => s.name === 'storeNotificationFrom');
      return r ? r.value : null;
    },
    googleClientId: (setting) => {
      // Prefer env var (operator-managed secret), fall back to setting row
      // so the value can also be configured from the admin UI if desired.
      if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID;
      const r = setting.find((s) => s.name === 'googleClientId');
      return r ? r.value : null;
    },
    firebaseConfig: () => {
      // Built from env vars at request time. The values are public-safe
      // (apiKey is a project-scoped client key, not a secret) — what
      // protects the project is the authorized-domains list configured
      // in the Firebase console.
      const apiKey = process.env.FIREBASE_WEB_API_KEY || null;
      const authDomain = process.env.FIREBASE_AUTH_DOMAIN || null;
      const projectId = process.env.FIREBASE_PROJECT_ID || null;
      const appId = process.env.FIREBASE_APP_ID || null;
      if (!apiKey || !projectId) return null;
      return { apiKey, authDomain, projectId, appId };
    }
  }
};
