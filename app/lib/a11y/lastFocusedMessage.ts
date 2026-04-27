import { type RefObject } from 'react';
import { type View } from 'react-native';

let lastRef: RefObject<View | null> | null = null;

export const setLastFocusedMessageRef = (ref: RefObject<View | null>): void => {
	lastRef = ref;
};

export const getLastFocusedMessageRef = (): RefObject<View | null> | null => lastRef;

export const clearLastFocusedMessageRef = (): void => {
	lastRef = null;
};
