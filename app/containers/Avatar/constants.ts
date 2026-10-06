import { isIOS26OrLater } from '~/lib/methods/helpers/deviceInfo';

export const AVATAR_BORDER_RADIUS = isIOS26OrLater ? 8 : 4;
