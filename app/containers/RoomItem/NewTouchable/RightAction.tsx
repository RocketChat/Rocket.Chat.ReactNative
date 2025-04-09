import React, { useCallback } from 'react';
import { RectButton } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { View, ColorValue } from 'react-native';

import { styles } from './styles';
import { useTheme } from '../../../theme';
import { CustomIcon } from '../../CustomIcon';
import { ACTION_WIDTH, CONDENSED_ICON_SIZE, EXPANDED_ICON_SIZE } from './constants';

export interface RightActionProps {
	x: number;
	progress: SharedValue<number>;
	totalWidth: number;
	color: ColorValue;
	onPress: () => void;
	children: React.ReactNode;
}

export function RightAction({ children, x, progress, totalWidth, onPress, color }: RightActionProps) {
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: interpolate(progress.value, [0, -totalWidth], [x, 0])
			}
		]
	}));

	return (
		<Animated.View style={[styles.rightActionView, { backgroundColor: color }, animatedStyle]}>
			<RectButton style={[styles.rightAction]} onPress={onPress}>
				{children}
			</RectButton>
		</Animated.View>
	);
}

interface RightActionsProps {
	progress: SharedValue<number>;
	isCondensed: boolean;
	favorite: boolean;
	handleAction: (action: 'favorite' | 'hide') => void;
}

export function RightActions({ progress, handleAction, isCondensed, favorite }: RightActionsProps) {
	const { colors } = useTheme();

	const handleFavoritePress = useCallback(() => {
		handleAction('favorite');
	}, [handleAction]);

	const handleReadPress = useCallback(() => {
		handleAction('hide');
	}, [handleAction]);

	return (
		<View style={styles.rightActionsView}>
			<RightAction
				color={colors.statusFontWarning}
				x={ACTION_WIDTH * 2}
				progress={progress}
				totalWidth={ACTION_WIDTH * 2}
				onPress={handleFavoritePress}>
				<CustomIcon
					size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
					name={favorite ? 'star-filled' : 'star'}
					color={colors.fontWhite}
				/>
			</RightAction>
			<RightAction
				color={colors.buttonBackgroundSecondaryPress}
				x={ACTION_WIDTH}
				progress={progress}
				totalWidth={ACTION_WIDTH * 2}
				onPress={handleReadPress}>
				<CustomIcon
					size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
					name='unread-on-top-disabled'
					color={colors.fontWhite}
				/>
			</RightAction>
		</View>
	);
}
