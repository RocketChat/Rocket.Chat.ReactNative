import { SharedTransition } from 'react-native-reanimated';

import { type IAttachment } from '~/definitions/IAttachment';

export type TMediaSize = { width: number; height: number };

export type TMediaSharedTransition = {
	tag: string;
	mediaSize?: TMediaSize;
};

export const getMediaSharedTransitionTag = (messageId: string, file: IAttachment): string =>
	`media-${messageId}-${file.title_link || file.image_url || file.video_url}`;

export const mediaSharedTransition = SharedTransition.duration(350);
