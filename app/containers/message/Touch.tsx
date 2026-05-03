import React from 'react';
import {
	View,
	StyleSheet,
	type ViewStyle,
	type StyleProp,
	type AccessibilityActionEvent,
	type AccessibilityActionInfo
} from 'react-native';
import { RectButton, type RectButtonProps } from 'react-native-gesture-handler';
import { withKeyboardFocus } from 'react-native-external-keyboard';

import { useTheme } from '../../theme';

export interface ITouchProps extends RectButtonProps {
	children: React.ReactNode;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	testID?: string;
	rectButtonStyle?: StyleProp<ViewStyle>;
	enabled?: boolean;
	android_rippleColor?: string;
}

const KeyboardComponent = withKeyboardFocus(RectButton);

const Touch = React.forwardRef<View, ITouchProps>(
	(
		{
			children,
			onPress,
			android_rippleColor,
			accessible,
			accessibilityLabel,
			accessibilityHint,
			accessibilityActions,
			onAccessibilityAction,
			style,
			rectButtonStyle,
			enabled = true,
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
			<KeyboardComponent
				ref={ref}
				onPress={onPress}
				underlayColor={android_rippleColor ?? colors.surfaceNeutral}
				rippleColor={android_rippleColor ?? colors.surfaceNeutral}
				activeOpacity={1}
				style={[rectButtonStyle, marginStyles, { backgroundColor, borderRadius }]}
				{...props}
				enabled={enabled}
				focusable={enabled}
				canBeFocused={enabled}>
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
			</KeyboardComponent>
		);
	}
);

export default Touch;
