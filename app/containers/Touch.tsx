import React from 'react';
import { RectButton, RectButtonProps } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme';

export interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	accessible?: boolean;
	accessibilityLabel?: string;
	testID?: string;
}

const Touch = React.forwardRef<React.ElementRef<typeof RectButton>, ITouchProps>(
	({ children, onPress, underlayColor, accessible, accessibilityLabel, style, ...props }, ref) => {
		const { colors } = useTheme();
		// The background color must be applied to the RectButton, not the View.
		// If set on the View, the touch opacity animation won't work properly.
		const flattenedStyle = StyleSheet.flatten(style) || {};
		const {
			backgroundColor,
			marginBottom,
			margin,
			marginLeft,
			marginVertical,
			marginHorizontal,
			marginEnd,
			marginRight,
			marginStart,
			marginTop,
			...viewStyle
		} = flattenedStyle;
		// The margin should be applied to the parent component.
		// If set on the View, it will create an internal margin inside the RectButton.
		const marginStyles = {
			margin,
			marginBottom,
			marginLeft,
			marginVertical,
			marginHorizontal,
			marginEnd,
			marginRight,
			marginStart,
			marginTop
		};
		return (
			<RectButton
				ref={ref}
				onPress={onPress}
				activeOpacity={1}
				underlayColor={underlayColor || colors.surfaceNeutral}
				rippleColor={colors.surfaceNeutral}
				style={{ ...marginStyles, backgroundColor }}
				{...props}>
				<View accessible={accessible} accessibilityLabel={accessibilityLabel} style={viewStyle}>
					{children}
				</View>
			</RectButton>
		);
	}
);

export default Touch;
