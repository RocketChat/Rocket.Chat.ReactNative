import { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { KeyboardFocusView } from 'react-native-external-keyboard';

import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { isInviteSubscription } from '~/lib/methods/isInviteSubscription';
import { useIsAccessibilityNavigationEnabled } from '~/lib/hooks/useIsAccessibilityNavigationEnabled';
import { fromSubscription, useRoomStore } from '../stores/RoomStoreContext';

const styles = StyleSheet.create({
	anchor: {
		width: 1,
		height: 1
	}
});

interface IRoomBodyFocusAnchorProps {
	children: ReactNode;
}

export const RoomBodyFocusAnchor = ({ children }: IRoomBodyFocusAnchorProps) => {
	const disabled = useRoomStore(fromSubscription(isInviteSubscription, false));
	const accessibilityNavigationEnabled = useIsAccessibilityNavigationEnabled();

	if (!hasNativeHeaderBar) {
		return <>{children}</>;
	}

	return (
		<>
			<KeyboardFocusView
				autoFocus={accessibilityNavigationEnabled && !disabled}
				enableA11yFocus={accessibilityNavigationEnabled && !disabled}
				focusable={!disabled}
				canBeFocused={!disabled}
				style={styles.anchor}
			/>
			{children}
		</>
	);
};
