import { type ReactNode, type Ref } from 'react';
import { type TouchableProps } from 'react-native-gesture-handler';
import {
	type AccessibilityRole,
	type AccessibilityState,
	type Insets,
	type StyleProp,
	type View,
	type ViewStyle
} from 'react-native';

export interface IGestureButtonProps {
	children?: ReactNode;
	ref?: Ref<View>;
	onPress?: TouchableProps['onPress'];
	onLongPress?: TouchableProps['onLongPress'];
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	hitSlop?: number | Insets;
	testID?: string;
	accessible?: boolean;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	accessibilityRole?: AccessibilityRole;
	accessibilityState?: AccessibilityState;
	rippleColor?: string;
	foreground?: boolean;
	activeOpacity?: number;
}
