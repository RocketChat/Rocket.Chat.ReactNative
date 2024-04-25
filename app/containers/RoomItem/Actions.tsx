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
					{ width: width * 2, backgroundColor: colors.badgeBackgroundLevel2, right: '100%' },
					viewHeight,
					animatedStyles
				]}
			>
				<View style={[styles.actionLeftButtonContainer, viewHeight]}>
					<RectButton style={styles.actionButton} onPress={onToggleReadPress}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name={isRead ? 'flag' : 'check'}
							color={colors.fontWhite}
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
	const viewHeight = isCondensed ? { height: ROW_HEIGHT_CONDENSED } : null;

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
				]}
			>
				<RectButton style={[styles.actionButton, { backgroundColor: colors.statusFontWarning }]} onPress={toggleFav}>
					<CustomIcon
						size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
						name={favorite ? 'star-filled' : 'star'}
						color={colors.fontWhite}
					/>
				</RectButton>
			</Animated.View>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width: width * 2,
						backgroundColor: colors.buttonBackgroundSecondaryPress,
						left: '100%'
					},
					isCondensed && { height: ROW_HEIGHT_CONDENSED },
					animatedHideStyles
				]}
			>
				<RectButton
					style={[styles.actionButton, { backgroundColor: colors.buttonBackgroundSecondaryPress }]}
					onPress={onHidePress}
				>
					<CustomIcon
						size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
						name='unread-on-top-disabled'
						color={colors.fontWhite}
					/>
				</RectButton>
			</Animated.View>
		</View>
	);
});
