import React from 'react';
import { Animated, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { isRTL } from '../../i18n';
import { CustomIcon } from '../CustomIcon';
import { DisplayMode, themes } from '../../lib/constants';
import styles, { ACTION_WIDTH, LONG_SWIPE, ROW_HEIGHT_CONDENSED } from './styles';
import { ILeftActionsProps, IRightActionsProps } from './interfaces';

const reverse = new Animated.Value(isRTL() ? -1 : 1);
const CONDENSED_ICON_SIZE = 24;
const EXPANDED_ICON_SIZE = 28;

export const LeftActions = React.memo(({ theme, transX, isRead, width, onToggleReadPress, displayMode }: ILeftActionsProps) => {
	const translateX = Animated.multiply(
		transX.interpolate({
			inputRange: [0, ACTION_WIDTH],
			outputRange: [-ACTION_WIDTH, 0]
		}),
		reverse
	);

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

	return (
		<View style={[styles.actionsContainer, styles.actionsLeftContainer]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{
						right: width - ACTION_WIDTH,
						width,
						transform: [{ translateX }],
						backgroundColor: themes[theme].tintColor
					},
					viewHeight
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
		const translateXFav = Animated.multiply(
			transX.interpolate({
				inputRange: [-width / 2, -ACTION_WIDTH * 2, 0],
				outputRange: [width / 2, width - ACTION_WIDTH * 2, width]
			}),
			reverse
		);
		const translateXHide = Animated.multiply(
			transX.interpolate({
				inputRange: [-width, -LONG_SWIPE, -ACTION_WIDTH * 2, 0],
				outputRange: [0, width - LONG_SWIPE, width - ACTION_WIDTH, width]
			}),
			reverse
		);

		const isCondensed = displayMode === DisplayMode.Condensed;
		const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

		return (
			<View style={[styles.actionsLeftContainer, viewHeight]} pointerEvents='box-none'>
				<Animated.View
					style={[
						styles.actionRightButtonContainer,
						{
							width,
							transform: [{ translateX: translateXFav }],
							backgroundColor: themes[theme].hideBackground
						},
						viewHeight
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
							width,
							transform: [{ translateX: translateXHide }]
						},
						isCondensed && { height: ROW_HEIGHT_CONDENSED }
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
