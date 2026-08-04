import { forwardRef, type ReactNode, type RefObject } from 'react';
import {
	View,
	StyleSheet,
	type ViewStyle,
	type StyleProp,
	type AccessibilityActionEvent,
	type AccessibilityActionInfo,
	TouchableOpacity,
	TouchableHighlight,
	type TouchableHighlightProps,
	type TouchableOpacityProps
} from 'react-native';
import { Pressable as RNNGHPressable } from 'react-native-gesture-handler';
import { withKeyboardFocus } from 'react-native-external-keyboard';

import { useTheme } from '../theme';
import { isIOS, isAndroid } from '../lib/methods/helpers';

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
	componentRef?: RefObject<View | null>;
}

const Component = isIOS ? TouchableOpacity : TouchableHighlight;
const KeyboardComponent = withKeyboardFocus(Component);
const RNGHKeyboardComponent = withKeyboardFocus(RNNGHPressable) as unknown as typeof KeyboardComponent;

const Touch = forwardRef<View, ITouchProps>(
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
			componentRef,
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
		const rippleColor = android_rippleColor ?? colors.surfaceNeutral;
		const touchableProps = isIOS ? {} : { android_ripple: { color: rippleColor } };
		const Wrapper = isAndroid ? RNGHKeyboardComponent : KeyboardComponent;

		return (
			<Wrapper
				ref={ref}
				componentRef={componentRef as RefObject<View>}
				onPress={onPress}
				accessible={accessible}
				accessibilityRole={props.accessibilityRole}
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={accessibilityHint}
				accessibilityActions={accessibilityActions}
				onAccessibilityAction={onAccessibilityAction}
				style={[rectButtonStyle, marginStyles, { backgroundColor, borderRadius }]}
				{...touchableProps}
				{...props}
				disabled={!enabled}
				focusable={enabled}
				canBeFocused={enabled}>
				<View style={viewStyle}>{children}</View>
			</Wrapper>
		);
	}
);

export default Touch;
