import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, withTiming, useDerivedValue, runOnJS } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { CustomIcon } from '../CustomIcon';
import { DisplayMode } from '../../lib/constants';
import styles, { ACTION_WIDTH, LONG_SWIPE, ROW_HEIGHT_CONDENSED } from './styles';
import { ILeftActionsProps, IRightActionsProps } from './interfaces';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

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

export const RightActions = React.memo(
	({ transX, favorite, width, toggleFav, onHidePress, displayMode, hideActive }: IRightActionsProps) => {
		const { colors } = useTheme();

		const animatedFavStyles = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));

		const hapticFeedback = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		const translateXHide = useDerivedValue(() => {
			if (I18n.isRTL) {
				if (hideActive.value) {
					runOnJS(hapticFeedback)();
					return withTiming(ACTION_WIDTH, { duration: 200 });
				}
				return withTiming(0, { duration: 200 });
			}
			if (hideActive.value) {
				runOnJS(hapticFeedback)();
				return withTiming(-ACTION_WIDTH, { duration: 200 });
			}
			return withTiming(0, { duration: 200 });
		});

		const animatedHideStyles = useAnimatedStyle(() => {
			if (I18n.isRTL) {
				if (transX.value < LONG_SWIPE && transX.value >= 2 * ACTION_WIDTH) {
					const parallaxSwipe = interpolate(transX.value, [2 * ACTION_WIDTH, LONG_SWIPE], [0, 0.1 * transX.value]);
					return { transform: [{ translateX: ACTION_WIDTH + parallaxSwipe + translateXHide.value }] };
				}
				return { transform: [{ translateX: transX.value - ACTION_WIDTH + translateXHide.value }] };
			}
			if (transX.value > -LONG_SWIPE && transX.value <= -2 * ACTION_WIDTH) {
				const parallaxSwipe = interpolate(transX.value, [-2 * ACTION_WIDTH, -LONG_SWIPE], [0, 0.1 * transX.value]);
				return { transform: [{ translateX: -ACTION_WIDTH + parallaxSwipe + translateXHide.value }] };
			}
			return { transform: [{ translateX: transX.value + ACTION_WIDTH + translateXHide.value }] };
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
	}
);
