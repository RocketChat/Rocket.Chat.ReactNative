// This file hosts the constants with the values used on native apps (User Defaults on iOS and Shared Preferences on Android).
import { isIOS } from '../utils/deviceInfo';

export const IDENTIFIER = isIOS ? 'group.ios.chat.rocket' : 'rocket.chat';
export const SERVERS = isIOS ? 'kServers' : 'ACCOUNTS_KEY';
export const TOKEN = isIOS ? 'kAuthToken' : 'authToken';
export const USER_ID = isIOS ? 'kUserId' : 'userId';
export const SERVER_URL = isIOS ? 'kAuthServerURL' : 'serverUrl';
export const SERVER_NAME = isIOS ? 'kServerName' : 'serverName';
export const SERVER_ICON = isIOS ? 'kServerIconURL' : 'serverLogoUrl';
export const ANDROID_PACKAGE_CONTEXT = 'chat.rocket.android';
