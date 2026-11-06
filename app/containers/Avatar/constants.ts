import { isIOS } from '~/lib/methods/helpers/deviceInfo';

export const AVATAR_BORDER_RADIUS = isIOS ? 8 : 4;
export const SKELETON_DELAY = 150;
