import React from 'react';
import { RectButton, RectButtonProps } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { useTheme } from '../theme';

export interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	accessible?: boolean;
	accessibilityLabel?: string;
	testID?: string;
}

const Touch = React.forwardRef<React.ElementRef<typeof RectButton>, ITouchProps>(
	({ children, onPress, underlayColor, accessible, accessibilityLabel, ...props }, ref) => {
		const { colors } = useTheme();

		return (
			// container for accessibility
			<View accessible={accessible} accessibilityLabel={accessibilityLabel} accessibilityRole='button'>
				<RectButton
					ref={ref}
					onPress={onPress}
					activeOpacity={1}
					underlayColor={underlayColor || colors.surfaceNeutral}
					rippleColor={colors.surfaceNeutral}
					{...props}>
					{children}
				</RectButton>
			</View>
		);
	}
);

export default Touch;
