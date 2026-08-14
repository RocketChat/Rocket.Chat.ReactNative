import { forwardRef, type ReactNode, type RefObject } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	type ViewStyle,
	type StyleProp,
	type AccessibilityActionEvent,
	type AccessibilityActionInfo,
	type TouchableOpacityProps,
	type TouchableHighlightProps
} from 'react-native';
import { Pressable, withKeyboardFocus } from 'react-native-external-keyboard';

import { useTheme } from '../theme';
import { isIOS } from '../lib/methods/helpers/deviceInfo';

export interface ITouchProps extends TouchableOpacityProps, TouchableHighlightProps {
	children: ReactNode;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	accessibilityActions?: AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
	testID?: string;
	rectButtonStyle?: StyleProp<ViewStyle>;
	enabled?: boolean;
	android_rippleColor?: string;
	rippleColor?: string;
	componentRef?: RefObject<View | null>;
}

const KeyboardTouchableOpacity = withKeyboardFocus(TouchableOpacity);
const Wrapper = (isIOS ? KeyboardTouchableOpacity : Pressable) as unknown as typeof KeyboardTouchableOpacity;

const Touch = forwardRef<View, ITouchProps>(
	(
		{
			children,
			onPress,
			android_rippleColor,
			rippleColor,
			accessible,
			accessibilityLabel,
			accessibilityHint,
			accessibilityActions,
			onAccessibilityAction,
			style,
			rectButtonStyle,
			enabled = true,
			disabled,
			componentRef,
			onLongPress,
			...props
		},
		ref
	) => {
		const { colors } = useTheme();
		// The background color must be applied to the pressable, not the View.
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
		// If set on the View, it will create an internal margin inside the pressable.
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
		const ripple = android_rippleColor ?? rippleColor ?? colors.surfaceNeutral;

		return (
			<Wrapper
				ref={ref}
				componentRef={componentRef as RefObject<View>}
				onPress={onPress}
				onLongPress={onLongPress}
				accessible={process.env.RUNNING_E2E_TESTS === 'true' ? false : accessible}
				accessibilityRole={props.accessibilityRole}
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={accessibilityHint}
				accessibilityActions={accessibilityActions}
				onAccessibilityAction={onAccessibilityAction}
				style={[rectButtonStyle, marginStyles, { backgroundColor, borderRadius }]}
				{...(isIOS ? {} : { android_ripple: { color: ripple } })}
				{...props}
				disabled={disabled === true || !enabled}
				focusable={enabled}
				canBeFocused={enabled}>
				<View style={viewStyle}>{children}</View>
			</Wrapper>
		);
	}
);

export default Touch;
