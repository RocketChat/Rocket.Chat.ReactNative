import React from 'react';
import { View, I18nManager } from 'react-native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../CustomIcon';
import { DisplayMode } from '../../lib/constants';
import styles, { ACTION_WIDTH, LONG_SWIPE, ROW_HEIGHT_CONDENSED, SMALL_SWIPE, PARALLAX_SWIPE } from './styles';
import { ILeftActionsProps, IRightActionsProps } from './interfaces';
import { useTheme } from '../../theme';

const CONDENSED_ICON_SIZE = 24;
const EXPANDED_ICON_SIZE = 28;

export const LeftActions = React.memo(({ transX, isRead, width, onToggleReadPress, displayMode }: ILeftActionsProps) => {
	const { colors } = useTheme();

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View style={[styles.actionsContainer, styles.actionsLeftContainer]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{ width: width * 2, backgroundColor: colors.tintColor, right: '100%' },
					viewHeight,
					animatedStyles
				]}>
				<View style={[styles.actionLeftButtonContainer, viewHeight]}>
					<RectButton style={styles.actionButton} onPress={onToggleReadPress}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name={isRead ? 'flag' : 'check'}
							color={colors.buttonText}
						/>
					</RectButton>
				</View>
			</Animated.View>
		</View>
	);
});

export const RightActions = React.memo(({ transX, favorite, width, toggleFav, onHidePress, displayMode }: IRightActionsProps) => {
	const { colors } = useTheme();

	const animatedFavStyles = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));

	const animatedHideStyles = useAnimatedStyle(() => {
		let translateXHide = interpolate(
			transX.value,
			[-width, -LONG_SWIPE, -ACTION_WIDTH * 2 - SMALL_SWIPE, -ACTION_WIDTH * 2, 0],
			[-width, -LONG_SWIPE, -ACTION_WIDTH - PARALLAX_SWIPE, -ACTION_WIDTH, 0]
		);
		if (I18nManager.isRTL) {
			translateXHide = interpolate(
				transX.value,
				[0, ACTION_WIDTH * 2, ACTION_WIDTH * 2 + SMALL_SWIPE, LONG_SWIPE, width],
				[0, ACTION_WIDTH, ACTION_WIDTH + PARALLAX_SWIPE, LONG_SWIPE, width]
			);
		}
		return { transform: [{ translateX: translateXHide }] };
	});

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View style={[styles.actionsLeftContainer, viewHeight]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width,
						backgroundColor: colors.favoriteBackground,
						left: '100%'
					},
					viewHeight,
					animatedFavStyles
				]}>
				<RectButton style={[styles.actionButton, { backgroundColor: colors.favoriteBackground }]} onPress={toggleFav}>
					<CustomIcon
						size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
						name={favorite ? 'star-filled' : 'star'}
						color={colors.buttonText}
					/>
				</RectButton>
			</Animated.View>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width: width * 2,
						backgroundColor: colors.hideBackground,
						left: '100%'
					},
					isCondensed && { height: ROW_HEIGHT_CONDENSED },
					animatedHideStyles
				]}>
				<RectButton style={[styles.actionButton, { backgroundColor: colors.hideBackground }]} onPress={onHidePress}>
					<CustomIcon
						size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
						name='unread-on-top-disabled'
						color={colors.buttonText}
					/>
				</RectButton>
			</Animated.View>
		</View>
	);
});
