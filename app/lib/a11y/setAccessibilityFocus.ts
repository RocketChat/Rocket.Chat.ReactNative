import { AccessibilityInfo, findNodeHandle, type View } from 'react-native';
import { type ComponentRef, type RefObject } from 'react';

export const setAccessibilityFocus = (ref: RefObject<ComponentRef<typeof View> | null> | null): void => {
	const node = ref?.current ? findNodeHandle(ref.current) : null;
	if (node) AccessibilityInfo.setAccessibilityFocus(node);
};
