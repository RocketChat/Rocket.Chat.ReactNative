import { getBundleId, isIOS } from '../utils/deviceInfo';
import { isOfficialBuild } from './environment';

const appStoreID = (isOfficialBuild) ? '1148741252' : '1272915472';
const APP_STORE_ID = appStoreID;

export const PLAY_MARKET_LINK = `https://play.google.com/store/apps/details?id=${ getBundleId }`;
export const FDROID_MARKET_LINK = 'https://f-droid.org/repo/chat.rocket.android_2057.apk'; // Once link is finalised, Update this
export const APP_STORE_LINK = `https://itunes.apple.com/app/id${ APP_STORE_ID }`;
export const LICENSE_LINK = 'https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/LICENSE';
export const STORE_REVIEW_LINK = isIOS ? `itms-apps://itunes.apple.com/app/id${ APP_STORE_ID }?action=write-review` : `market://details?id=${ getBundleId }`;
