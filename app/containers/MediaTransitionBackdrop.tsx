import { type ReactElement } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '~/theme';
import { mediaSharedTransition } from '~/lib/animations/mediaSharedTransition';

export const MediaTransitionBackdrop = ({
	sharedTransitionTag,
	style
}: {
	sharedTransitionTag?: string;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { colors } = useTheme();
	return (
		<Animated.View
			style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceNeutral }, style]}
			sharedTransitionTag={sharedTransitionTag}
			sharedTransitionStyle={mediaSharedTransition}
		/>
	);
};
