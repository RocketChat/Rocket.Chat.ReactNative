import { getBundleId, isIOS } from '../utils/deviceInfo';

export const PLAY_MARKET_LINK = 'https://play.google.com/store/apps/details?id=chat.rocket.reactnative';
export const APP_STORE_LINK = 'https://itunes.apple.com/app/rocket-chat-experimental/id1272915472?ls=1&mt=8';
export const LICENSE_LINK = 'https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/LICENSE';

const id = getBundleId.includes('reactnative') ? '1272915472' : '1148741252';
export const STORE_REVIEW_LINK = isIOS ? `itms-apps://itunes.apple.com/app/id${ id }?action=write-review` : `market://details?id=${ getBundleId }`;
