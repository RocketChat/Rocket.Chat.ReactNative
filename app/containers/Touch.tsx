import React from 'react';
import { RectButton, RectButtonProps } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { useTheme } from '../theme';

export interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	accessibilityLabel?: string;
	testID?: string;
}

const Touch = React.forwardRef<RectButton, ITouchProps>(({ children, onPress, underlayColor, testID, ...props }, ref) => {
	const { colors } = useTheme();

	return (
		<View testID={testID}>
			<RectButton
				ref={ref}
				onPress={onPress}
				activeOpacity={1}
				underlayColor={underlayColor || colors.bannerBackground}
				rippleColor={colors.bannerBackground}
				{...props}
			>
				{children}
			</RectButton>
		</View>
	);
});

export default Touch;
