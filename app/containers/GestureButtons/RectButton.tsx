import { Touchable } from 'react-native-gesture-handler';

import { isAndroid } from '~/lib/methods/helpers/deviceInfo';
import { type IGestureButtonProps } from './types';

interface IRectButtonProps extends IGestureButtonProps {
	underlayColor?: string;
}

const RectButton = ({
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
	underlayColor = 'black',
	activeOpacity = 0.105
}: IRectButtonProps) => (
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
		androidRipple={isAndroid ? { color: rippleColor, foreground } : undefined}
		underlayColor={isAndroid ? undefined : underlayColor}
		activeUnderlayOpacity={isAndroid ? undefined : activeOpacity}
		animationDuration={isAndroid ? undefined : 0}>
		{children}
	</Touchable>
);

export default RectButton;
