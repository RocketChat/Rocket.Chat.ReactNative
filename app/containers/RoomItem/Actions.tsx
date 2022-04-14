import React from 'react';
import { View, I18nManager } from 'react-native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../CustomIcon';
import { DisplayMode, themes } from '../../lib/constants';
import styles, { ACTION_WIDTH, LONG_SWIPE, ROW_HEIGHT_CONDENSED, SMALL_SWIPE, PARALLAX_SWIPE } from './styles';
import { ILeftActionsProps, IRightActionsProps } from './interfaces';

const CONDENSED_ICON_SIZE = 24;
const EXPANDED_ICON_SIZE = 28;

export const LeftActions = React.memo(({ theme, transX, isRead, width, onToggleReadPress, displayMode }: ILeftActionsProps) => {
	const animatedStyles = useAnimatedStyle(() => {
		let translateX = transX.value;
		if (I18nManager.isRTL) {
			translateX = interpolate(transX.value, [-ACTION_WIDTH, 0], [width - ACTION_WIDTH, width]);
			return {
				transform: [{ translateX }]
			};
		}
		return {
			right: width,
			transform: [{ translateX }]
		};
	});

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View style={[styles.actionsContainer, styles.actionsLeftContainer]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{
						width: width * 2,
						backgroundColor: themes[theme].tintColor
					},
					viewHeight,
					animatedStyles
				]}>
				<View style={[styles.actionLeftButtonContainer, viewHeight]}>
					<RectButton style={styles.actionButton} onPress={onToggleReadPress}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name={isRead ? 'flag' : 'check'}
							color={themes[theme].buttonText}
						/>
					</RectButton>
				</View>
			</Animated.View>
		</View>
	);
});

export const RightActions = React.memo(
	({ transX, favorite, width, toggleFav, onHidePress, theme, displayMode }: IRightActionsProps) => {
		const animatedFavStyles = useAnimatedStyle(() => {
			let translateXFav = interpolate(
				transX.value,
				[-width / 2, -ACTION_WIDTH * 2, 0],
				[width / 2, width - ACTION_WIDTH * 2, width]
			);
			if (I18nManager.isRTL) {
				translateXFav = interpolate(
					transX.value,
					[0, ACTION_WIDTH * 2, width / 2],
					[-width, -width + ACTION_WIDTH * 2, -width / 2]
				);
			}
			return { transform: [{ translateX: translateXFav }] };
		});

		const animatedHideStyles = useAnimatedStyle(() => {
			let translateXHide = interpolate(
				transX.value,
				[-width, -LONG_SWIPE, -ACTION_WIDTH * 2 - SMALL_SWIPE, -ACTION_WIDTH * 2, 0],
				[0, width - LONG_SWIPE, width - ACTION_WIDTH - PARALLAX_SWIPE, width - ACTION_WIDTH, width]
			);
			if (I18nManager.isRTL) {
				translateXHide = interpolate(
					transX.value,
					[0, ACTION_WIDTH * 2, ACTION_WIDTH * 2 + SMALL_SWIPE, LONG_SWIPE, width],
					[-width, -width + ACTION_WIDTH, -width + ACTION_WIDTH + PARALLAX_SWIPE, -width + LONG_SWIPE, 0]
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
							backgroundColor: themes[theme].favoriteBackground
						},
						viewHeight,
						animatedFavStyles
					]}>
					<RectButton style={[styles.actionButton, { backgroundColor: themes[theme].favoriteBackground }]} onPress={toggleFav}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name={favorite ? 'star-filled' : 'star'}
							color={themes[theme].buttonText}
						/>
					</RectButton>
				</Animated.View>
				<Animated.View
					style={[
						styles.actionRightButtonContainer,
						{
							width: width * 2,
							backgroundColor: themes[theme].hideBackground
						},
						isCondensed && { height: ROW_HEIGHT_CONDENSED },
						animatedHideStyles
					]}>
					<RectButton style={[styles.actionButton, { backgroundColor: themes[theme].hideBackground }]} onPress={onHidePress}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name='unread-on-top-disabled'
							color={themes[theme].buttonText}
						/>
					</RectButton>
				</Animated.View>
			</View>
		);
	}
);
