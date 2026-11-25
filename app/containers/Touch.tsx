import { forwardRef, type ReactNode } from 'react';
import { Touchable, type TouchableProps } from 'react-native-gesture-handler';
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
import { isAndroid } from '../lib/methods/helpers/deviceInfo';

export interface ITouchProps extends TouchableProps {
	rippleColor?: string;
	children: ReactNode;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	testID?: string;
	rectButtonStyle?: StyleProp<ViewStyle>;
	disabled?: boolean;
}

const KeyboardTouchable = withKeyboardFocus(Touchable);

const Touch = forwardRef<any, ITouchProps>(
	(
		{
			children,
			onPress,
			underlayColor,
			rippleColor,
			accessible,
			accessibilityLabel,
			accessibilityHint,
			accessibilityActions,
			onAccessibilityAction,
			testID,
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
			<KeyboardTouchable
				ref={ref}
				onPress={onPress}
				androidRipple={isAndroid ? { color: rippleColor ?? colors.surfaceNeutral } : undefined}
				underlayColor={isAndroid ? undefined : underlayColor || colors.surfaceNeutral}
				activeUnderlayOpacity={isAndroid ? undefined : 1}
				animationDuration={isAndroid ? undefined : 0}
				focusable={!disabled}
				canBeFocused={!disabled}
				style={[rectButtonStyle, marginStyles, { backgroundColor, borderRadius }]}
				{...props}
				disabled={disabled}>
				<View
					testID={testID}
					accessible={accessible}
					accessibilityRole={props.accessibilityRole}
					accessibilityLabel={accessibilityLabel}
					accessibilityHint={accessibilityHint}
					accessibilityActions={accessibilityActions}
					onAccessibilityAction={onAccessibilityAction}
					style={viewStyle}>
					{children}
				</View>
			</KeyboardTouchable>
		);
	}
);

export default Touch;
