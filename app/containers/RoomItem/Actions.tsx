import React from 'react';
import { View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	interpolate,
	withSpring,
	runOnJS,
	useAnimatedReaction,
	useSharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DisplayMode } from '../../lib/constants';
import styles, { ACTION_WIDTH, LONG_SWIPE } from './styles';
import { ILeftActionsProps, IRightActionsProps } from './interfaces';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { useRowHeight } from '../../lib/hooks/useRowHeight';
import ActionButton from './ActionButton';

export const LeftActions = React.memo(function LeftActions({
	transX,
	enabled,
	isRead,
	width,
	onToggleReadPress,
	displayMode
}: ILeftActionsProps) {
	const { colors } = useTheme();

	const { rowHeight, rowHeightCondensed } = useRowHeight();

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = { height: isCondensed ? rowHeightCondensed : rowHeight };

	return (
		<View style={[styles.actionsContainer, styles.actionsLeftContainer]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{ width: width * 2, backgroundColor: colors.badgeBackgroundLevel2, right: '100%' },
					viewHeight,
					animatedStyles
				]}>
				<View style={[styles.actionLeftButtonContainer, viewHeight]}>
					<ActionButton
						enabled={enabled}
						onPress={onToggleReadPress}
						iconName={isRead ? 'flag' : 'check'}
						backgroundColor={colors.badgeBackgroundLevel2}
						isCondensed={isCondensed}
						iconColor={colors.fontWhite}
					/>
				</View>
			</Animated.View>
		</View>
	);
});

export const RightActions = React.memo(function RightActionsContainer({
	transX,
	favorite,
	width,
	toggleFav,
	onHidePress,
	displayMode,
	enabled
}: IRightActionsProps) {
	const { colors } = useTheme();

	const { rowHeight, rowHeightCondensed } = useRowHeight();

	const animatedFavStyles = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));

	const translateXHide = useSharedValue(0);

	const triggerHideAnimation = (toValue: number) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		translateXHide.value = withSpring(toValue, { overshootClamping: true, mass: 0.7 });
	};

	useAnimatedReaction(
		() => transX.value,
		(currentTransX, previousTransX) => {
			// Triggers the animation and hapticFeedback if swipe reaches/unreaches the threshold.
			if (I18n.isRTL) {
				if (previousTransX && currentTransX > LONG_SWIPE && previousTransX <= LONG_SWIPE) {
					runOnJS(triggerHideAnimation)(ACTION_WIDTH);
				} else if (previousTransX && currentTransX <= LONG_SWIPE && previousTransX > LONG_SWIPE) {
					runOnJS(triggerHideAnimation)(0);
				}
			} else if (previousTransX && currentTransX < -LONG_SWIPE && previousTransX >= -LONG_SWIPE) {
				runOnJS(triggerHideAnimation)(-ACTION_WIDTH);
			} else if (previousTransX && currentTransX >= -LONG_SWIPE && previousTransX < -LONG_SWIPE) {
				runOnJS(triggerHideAnimation)(0);
			}
		}
	);

	const animatedHideStyles = useAnimatedStyle(() => {
		if (I18n.isRTL) {
			if (transX.value < LONG_SWIPE && transX.value >= 2 * ACTION_WIDTH) {
				const parallaxSwipe = interpolate(
					transX.value,
					[2 * ACTION_WIDTH, LONG_SWIPE],
					[ACTION_WIDTH, ACTION_WIDTH + 0.1 * transX.value]
				);
				return { transform: [{ translateX: parallaxSwipe + translateXHide.value }] };
			}
			return { transform: [{ translateX: transX.value - ACTION_WIDTH + translateXHide.value }] };
		}
		if (transX.value > -LONG_SWIPE && transX.value <= -2 * ACTION_WIDTH) {
			const parallaxSwipe = interpolate(
				transX.value,
				[-2 * ACTION_WIDTH, -LONG_SWIPE],
				[-ACTION_WIDTH, -ACTION_WIDTH + 0.1 * transX.value]
			);
			return { transform: [{ translateX: parallaxSwipe + translateXHide.value }] };
		}
		return { transform: [{ translateX: transX.value + ACTION_WIDTH + translateXHide.value }] };
	});

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = { height: isCondensed ? rowHeightCondensed : rowHeight };

	return (
		<View style={[styles.actionsLeftContainer, viewHeight]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width,
						backgroundColor: colors.statusFontWarning,
						left: '100%'
					},
					viewHeight,
					animatedFavStyles
				]}>
				<ActionButton
					enabled={enabled}
					onPress={toggleFav}
					iconName={favorite ? 'star-filled' : 'star'}
					iconColor={colors.fontWhite}
					backgroundColor={colors.statusFontWarning}
					isCondensed={isCondensed}
				/>
			</Animated.View>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width: width * 2,
						backgroundColor: colors.buttonBackgroundSecondaryPress,
						left: '100%'
					},
					viewHeight,
					animatedHideStyles
				]}>
				<ActionButton
					enabled={enabled}
					onPress={onHidePress}
					iconName='unread-on-top-disabled'
					iconColor={colors.fontWhite}
					backgroundColor={colors.buttonBackgroundSecondaryPress}
					isCondensed={isCondensed}
				/>
			</Animated.View>
		</View>
	);
});
