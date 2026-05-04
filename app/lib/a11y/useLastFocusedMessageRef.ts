import { type RefObject } from 'react';
import { type View } from 'react-native';

let lastRef: RefObject<View | null> | null = null;

const api = {
	set: (ref: RefObject<View | null>): void => {
		lastRef = ref;
	},
	get: (): RefObject<View | null> | null => lastRef,
	clear: (): void => {
		lastRef = null;
	}
};

export const useLastFocusedMessageRef = () => api;
