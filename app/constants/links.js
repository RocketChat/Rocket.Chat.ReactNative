import { getBundleId, isIOS } from '../utils/deviceInfo';

const APP_STORE_ID = '1272915472';

export const PLAY_MARKET_LINK = `market://details?id=${ getBundleId }`;
export const APP_STORE_LINK = `itms-apps://itunes.apple.com/app/id${ APP_STORE_ID }`;
export const LICENSE_LINK = 'https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/LICENSE';
export const STORE_REVIEW_LINK = isIOS ? `${ APP_STORE_LINK }?action=write-review` : PLAY_MARKET_LINK;
