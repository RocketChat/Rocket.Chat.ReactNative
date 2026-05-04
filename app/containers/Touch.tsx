import React from 'react';
import { RectButton, type RectButtonProps } from 'react-native-gesture-handler';
import {
	View,
	StyleSheet,
	type ViewStyle,
	type StyleProp,
	type AccessibilityActionEvent,
	type AccessibilityActionInfo
} from 'react-native';
import { withKeyboardFocus } from 'react-native-external-keyboard';

import { useTheme } from '../theme';

export interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	testID?: string;
	rectButtonStyle?: StyleProp<ViewStyle>;
	disabled?: boolean;
	android_rippleColor?: string;
}

const KeyboardRectButton = withKeyboardFocus(RectButton);

const Touch = React.forwardRef<View, ITouchProps>(
	(
		{
			children,
			onPress,
			underlayColor,
			android_rippleColor,
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
			<KeyboardRectButton
				ref={ref}
				onPress={onPress}
				activeOpacity={1}
				underlayColor={underlayColor || colors.surfaceNeutral}
				rippleColor={android_rippleColor || colors.surfaceNeutral}
				focusable={!disabled}
				canBeFocused={!disabled}
				style={[rectButtonStyle, marginStyles, { backgroundColor, borderRadius }]}
				{...props}
				enabled={!disabled}>
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
			</KeyboardRectButton>
		);
	}
);

export default Touch;
