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
	type TouchableWithoutFeedbackProps
} from 'react-native';
import { withKeyboardFocus } from 'react-native-external-keyboard';

import { useTheme } from '../../../../theme';
import { isIOS } from '../../../../lib/methods/helpers';

export interface ITouchProps extends TouchableWithoutFeedbackProps {
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
		const touchableProps = isIOS ? {} : { underlayColor: android_rippleColor ?? colors.surfaceNeutral, activeOpacity: 1 };

		return (
			<KeyboardComponent
				ref={ref}
				// Library types componentRef as RefObject<View>, but useRef<View>(null) yields RefObject<View | null>. The lib only reads .current with a null check, so the cast is safe.
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
				{/* The accessibility props live on the focusable Touchable above. The inner View is a
				    layout-only container; marking it accessible would create a second sibling node with
				    the same label, causing double VoiceOver announcements and confusing TalkBack swipe nav. */}
				<View style={viewStyle}>{children}</View>
			</KeyboardComponent>
		);
	}
);

export default Touch;
