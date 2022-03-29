import i18n from './index';

// https://github.com/zoontek/react-native-localize/blob/master/src/constants.ts#L5
const USES_RTL_LAYOUT = ['ar', 'ckb', 'fa', 'he', 'ks', 'lrc', 'mzn', 'ps', 'ug', 'ur', 'yi'];

export const isRTL = (locale?: string) => (locale ? USES_RTL_LAYOUT.includes(locale) : i18n.isRTL);
