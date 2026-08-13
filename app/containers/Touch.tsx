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
import { isIOS, isAndroid } from '../lib/methods/helpers/deviceInfo';
import { useResponderLongPress } from '../lib/hooks/useResponderLongPress';
import { isExternalKeyboardConnected } from '../lib/methods/helpers/externalInput';

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
	/**
	 * Android only. Detects onLongPress through the JS responder system rather than gesture-handler, so
	 * nested press targets that live in that system win by depth. Set it when the subtree contains RN press
	 * targets that must beat this one — markdown links inside a message, say — and leave it off when the
	 * subtree instead competes with gesture-handler gestures, such as a row inside a Swipeable.
	 */
	longPressViaResponder?: boolean;
}

const Component = isIOS ? TouchableOpacity : TouchableHighlight;
const KeyboardComponent = withKeyboardFocus(Component);
const usingRNGHPressable = isAndroid && !isExternalKeyboardConnected();
const RNGHComponent = RNNGHPressable as unknown as typeof KeyboardComponent;

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
			longPressViaResponder,
			onLongPress,
			...props
		},
		ref
	) => {
		const { colors } = useTheme();
		// When routed through the responder system, onLongPress is handled by the inner View instead of the
		// gesture-handler Pressable below, so the two are mutually exclusive.
		const useResponder = isAndroid && !!longPressViaResponder;
		const responderProps = useResponderLongPress(useResponder ? onLongPress : undefined, enabled);
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
		const touchableProps = isIOS
			? {}
			: usingRNGHPressable
				? { android_ripple: { color: rippleColor } }
				: { underlayColor: rippleColor };
		const Wrapper = usingRNGHPressable ? RNGHComponent : KeyboardComponent;

		return (
			<Wrapper
				ref={ref}
				componentRef={componentRef as RefObject<View>}
				onPress={onPress}
				onLongPress={useResponder ? undefined : onLongPress}
				accessible={process.env.RUNNING_E2E_TESTS === 'true' ? false : accessible}
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
				<View style={viewStyle} {...responderProps}>
					{children}
				</View>
			</Wrapper>
		);
	}
);

export default Touch;
