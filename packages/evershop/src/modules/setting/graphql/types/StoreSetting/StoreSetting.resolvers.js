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
    }
  }
};
