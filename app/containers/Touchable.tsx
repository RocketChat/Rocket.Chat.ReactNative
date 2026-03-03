import React from 'react';
import {
	View,
	StyleSheet,
	type ViewStyle,
	type StyleProp,
	type AccessibilityActionEvent,
	type AccessibilityActionInfo,
	TouchableNativeFeedback,
	TouchableOpacity,
	type TouchableWithoutFeedbackProps
} from 'react-native';

import { useTheme } from '../theme';
import { isIOS } from '../lib/methods/helpers';

export interface ITouchProps extends TouchableWithoutFeedbackProps {
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

const Component = isIOS ? TouchableOpacity : TouchableNativeFeedback;

const Touchable = React.forwardRef<
	React.ElementRef<typeof TouchableOpacity> | React.ElementRef<typeof TouchableNativeFeedback>,
	ITouchProps
>(
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
			enabled,
			...props
		}
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
		const androidProps = isIOS ? {} : { android_rippleColor: colors.surfaceNeutral };
		const touchableProps = isIOS ? { activeOpacity: 1 } : {};

		return (
			<Component
				onPress={onPress}
				style={[rectButtonStyle, marginStyles, { backgroundColor, borderRadius }]}
				disabled={!enabled}
				{...touchableProps}
				{...androidProps}
				{...props}>
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
			</Component>
		);
	}
);

export default Touchable;
