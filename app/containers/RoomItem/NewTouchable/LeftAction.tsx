import React, { useCallback } from 'react';
import { RectButton } from 'react-native-gesture-handler';
import Animated, { Extrapolation, type SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { ColorValue } from 'react-native';

import { styles } from './styles';
import { useTheme } from '../../../theme';
import { CustomIcon } from '../../CustomIcon';
import { CONDENSED_ICON_SIZE, EXPANDED_ICON_SIZE } from './constants';

interface LeftActionProps {
	dragX: SharedValue<number>;
	onPress: () => void;
	color: ColorValue;
	children: React.ReactNode;
}

export const LeftAction = ({ color, dragX, onPress, children }: LeftActionProps) => {
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: interpolate(dragX.value, [0, 50, 100, 101], [-20, 0, 0, 1], Extrapolation.CLAMP)
			}
		]
	}));
	return (
		<RectButton style={[styles.leftAction, { backgroundColor: color }]} onPress={onPress}>
			<Animated.View style={[styles.leftActionView, animatedStyle]}>{children}</Animated.View>
		</RectButton>
	);
};

interface LeftActionsProps {
	progress: SharedValue<number>;
	isCondensed: boolean;
	isRead: boolean;
	handleAction: (action: 'read') => void;
}

export function LeftActions({ progress, isRead, isCondensed, handleAction }: LeftActionsProps) {
	const { colors } = useTheme();
	const handleReadPress = useCallback(() => {
		handleAction('read');
	}, [handleAction]);

	return (
		<LeftAction color={colors.badgeBackgroundLevel2} dragX={progress} onPress={handleReadPress}>
			<CustomIcon
				size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
				name={isRead ? 'flag' : 'check'}
				color={colors.fontWhite}
			/>
		</LeftAction>
	);
}
