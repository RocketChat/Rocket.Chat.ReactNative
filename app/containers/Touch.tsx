import React from 'react';
import { RectButton, RectButtonProps } from 'react-native-gesture-handler';

import { useTheme } from '../theme';

export interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	accessibilityLabel?: string;
	testID?: string;
}

const Touch = React.forwardRef<RectButton, ITouchProps>(({ children, onPress, underlayColor, ...props }, ref) => {
	const { colors } = useTheme();

	return (
		<RectButton
			ref={ref}
			onPress={onPress}
			activeOpacity={1}
			underlayColor={underlayColor || colors.surfaceNeutral}
			rippleColor={colors.surfaceNeutral}
			{...props}
		>
			{children}
		</RectButton>
	);
});

export default Touch;
