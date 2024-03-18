import React from 'react';
import { RectButton, RectButtonProps } from 'react-native-gesture-handler';

import { useTheme } from '../theme';

export interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	accessibilityLabel?: string;
	testID?: string;
}

const Touch = React.forwardRef<RectButton, ITouchProps>(({ children, onPress, underlayColor, disabled, ...props }, ref) => {
	const { colors } = useTheme();

	return (
		<RectButton
			ref={ref}
			onPress={onPress}
			activeOpacity={1}
			underlayColor={underlayColor || colors.bannerBackground}
			rippleColor={colors.bannerBackground}
			{...props}
			opacity={disabled ? 0.5 : 1}
		>
			{children}
		</RectButton>
	);
});

export default Touch;
