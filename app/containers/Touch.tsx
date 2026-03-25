import React from 'react';
import {
	View,
	Pressable,
	StyleSheet,
	type ViewStyle,
	type StyleProp,
	type PressableProps,
	type AccessibilityActionEvent,
	type AccessibilityActionInfo
} from 'react-native';

import { useTheme } from '../theme';

export interface ITouchProps extends Omit<PressableProps, 'style' | 'children'> {
	children: React.ReactNode;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	testID?: string;
	rectButtonStyle?: StyleProp<ViewStyle>;
	underlayColor?: string;
	activeOpacity?: number;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
}

const Touch = React.forwardRef<React.ElementRef<typeof Pressable>, ITouchProps>(
	(
		{
			children,
			onPress,
			underlayColor,
			activeOpacity = 1,
			accessible,
			accessibilityLabel,
			accessibilityHint,
			accessibilityActions,
			onAccessibilityAction,
			style,
			rectButtonStyle,
			disabled,
			...props
		},
		ref
	) => {
		const { colors } = useTheme();
		// The background color must be applied to the RectButton, not the View.
		// If set on the View, the touch opacity animation won't work properly.
		const flattenedStyle = StyleSheet.flatten(style) || {};
		const {
			borderRadius,
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
			<Pressable
				ref={ref}
				onPress={onPress}
				android_ripple={{ color: underlayColor || colors.surfaceNeutral, borderless: false }}
				style={({ pressed }) => [
					rectButtonStyle,
					marginStyles,
					{
						backgroundColor: pressed ? underlayColor || colors.surfaceNeutral : backgroundColor,
						borderRadius,
						opacity: pressed ? activeOpacity : 1
					}
				]}
				{...props}
				disabled={disabled}>
				<View
					accessible={accessible}
					accessibilityRole={props.accessibilityRole}
					accessibilityLabel={accessibilityLabel}
					accessibilityHint={accessibilityHint}
					accessibilityActions={accessibilityActions}
					onAccessibilityAction={onAccessibilityAction}
					style={viewStyle}>
					{children}
				</View>
			</Pressable>
		);
	}
);

export default Touch;
