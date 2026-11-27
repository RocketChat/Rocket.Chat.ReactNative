import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import type { ILockScreenHostProps } from './types';

export const LockScreenHost = ({ visible, requestId, onShown, onHidden, children }: ILockScreenHostProps) => {
	const wasVisible = useRef(false);

	useEffect(() => {
		if (visible) {
			onShown();
		} else if (wasVisible.current) {
			onHidden();
		}
		wasVisible.current = visible;
	}, [visible, requestId, onShown, onHidden]);

	if (!visible) {
		return null;
	}
	return (
		<FullWindowOverlay>
			<View style={StyleSheet.absoluteFill}>{children}</View>
		</FullWindowOverlay>
	);
};
