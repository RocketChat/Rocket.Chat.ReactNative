import { SharedTransition } from 'react-native-reanimated';

export type TMediaSize = { width: number; height: number };

export type TMediaSharedTransition = {
	tag: string;
	mediaSize?: TMediaSize;
};

export const mediaSharedTransition = SharedTransition.duration(350);
