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

const Touch = React.forwardRef<RectButton, ITouchProps>(
	({ children, onPress, underlayColor, accessible, accessibilityLabel, ...props }, ref) => {
		const { colors } = useTheme();

		return (
			<RectButton
				ref={ref}
				onPress={onPress}
				activeOpacity={1}
				underlayColor={underlayColor || colors.surfaceNeutral}
				rippleColor={colors.surfaceNeutral}
				{...props}
				style={{}}>
				<View accessible={accessible} accessibilityLabel={accessibilityLabel} accessibilityRole='button' style={props.style}>
					{children}
				</View>
			</RectButton>
		);
	}
);

export default Touch;
