import { Touchable } from 'react-native-gesture-handler';

import { isAndroid } from '~/lib/methods/helpers/deviceInfo';
import { type IGestureButtonProps } from './types';

const BorderlessButton = ({
	children,
	ref,
	onPress,
	onLongPress,
	disabled,
	style,
	hitSlop,
	testID,
	accessible,
	accessibilityLabel,
	accessibilityHint,
	accessibilityRole,
	accessibilityState,
	rippleColor,
	foreground,
	activeOpacity = 0.3
}: IGestureButtonProps) => (
	<Touchable
		ref={ref}
		onPress={onPress}
		onLongPress={onLongPress}
		disabled={disabled}
		style={style}
		hitSlop={hitSlop}
		testID={testID}
		accessible={accessible}
		accessibilityLabel={accessibilityLabel}
		accessibilityHint={accessibilityHint}
		accessibilityRole={accessibilityRole}
		accessibilityState={accessibilityState}
		androidRipple={isAndroid ? { color: rippleColor, borderless: true, foreground } : undefined}
		activeOpacity={isAndroid ? undefined : activeOpacity}
		animationDuration={isAndroid ? undefined : 0}>
		{children}
	</Touchable>
);

export default BorderlessButton;
