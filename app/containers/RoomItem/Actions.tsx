import { memo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';

import { CustomIcon } from '../CustomIcon';
import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import styles, { getOpenWidth, getFullSwipeThreshold } from './styles';
import { type ILeftActionsProps, type IRightActionsProps } from './interfaces';
import { useTheme } from '~/theme';
import I18n from '~/i18n';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

const CONDENSED_ICON_SIZE = 24;
const EXPANDED_ICON_SIZE = 28;
const EXPAND_DURATION = 300;

export const LeftActions = memo(({ transX, isRead, width, onToggleReadPress, displayMode }: ILeftActionsProps) => {
	const { colors } = useTheme();

	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();

	const iconSlotWidth = getOpenWidth(width) / 2;

	const animatedButtonStyles = useAnimatedStyle(() => ({
		width: Math.max(transX.value, 0)
	}));

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = { height: isCondensed ? rowHeightCondensed : rowHeight };

	return (
		<View
			style={[styles.actionsContainer, styles.actionsLeftContainer]}
			pointerEvents='box-none'
			accessibilityElementsHidden
			importantForAccessibility='no'>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{ left: 0, backgroundColor: colors.badgeBackgroundLevel2 },
					viewHeight,
					animatedButtonStyles
				]}>
				<RectButton
					accessible={false}
					accessibilityLabel={I18n.t(isRead ? 'Mark_unread' : 'Mark_read')}
					style={[styles.actionButton, styles.actionButtonContentEnd]}
					onPress={onToggleReadPress}>
					<View style={[styles.actionIconSlot, { width: iconSlotWidth }]}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name={isRead ? 'flag' : 'check'}
							color={colors.fontWhite}
						/>
					</View>
				</RectButton>
			</Animated.View>
		</View>
	);
});

export const RightActions = memo(({ transX, favorite, width, toggleFav, onHidePress, displayMode }: IRightActionsProps) => {
	const { colors } = useTheme();

	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();

	const iconSlotWidth = getOpenWidth(width) / 2;
	const fullSwipeThreshold = getFullSwipeThreshold(width);

	const crossedThreshold = useSharedValue(false);
	const expandProgress = useSharedValue(0);

	const triggerThresholdHaptic = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	useAnimatedReaction(
		() => -transX.value >= fullSwipeThreshold,
		isCrossed => {
			if (isCrossed !== crossedThreshold.value) {
				crossedThreshold.value = isCrossed;
				expandProgress.value = withTiming(isCrossed ? 1 : 0, { duration: EXPAND_DURATION });
				scheduleOnRN(triggerThresholdHaptic);
			}
		}
	);

	const animatedFavStyles = useAnimatedStyle(() => {
		const reveal = Math.max(-transX.value, 0);
		const favoriteWidth = (reveal / 2) * (1 - expandProgress.value);
		return { width: favoriteWidth, right: reveal - favoriteWidth };
	});

	const animatedHideStyles = useAnimatedStyle(() => {
		const reveal = Math.max(-transX.value, 0);
		const favoriteWidth = (reveal / 2) * (1 - expandProgress.value);
		return { width: reveal - favoriteWidth };
	});

	const isCondensed = displayMode === DisplayMode.Condensed;
	const viewHeight = { height: isCondensed ? rowHeightCondensed : rowHeight };

	return (
		<View
			style={[styles.actionsLeftContainer, viewHeight]}
			pointerEvents='box-none'
			accessibilityElementsHidden
			importantForAccessibility='no'>
			<Animated.View
				style={[styles.actionRightButtonContainer, { backgroundColor: colors.statusFontWarning }, viewHeight, animatedFavStyles]}>
				<RectButton
					accessible={false}
					accessibilityLabel={I18n.t(favorite ? 'Unfavorite' : 'Favorite')}
					style={styles.actionButton}
					onPress={toggleFav}>
					<View style={[styles.actionIconSlot, { width: iconSlotWidth }]}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name={favorite ? 'star-filled' : 'star'}
							color={colors.fontWhite}
						/>
					</View>
				</RectButton>
			</Animated.View>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{ right: 0, backgroundColor: colors.buttonBackgroundSecondaryPress },
					viewHeight,
					animatedHideStyles
				]}>
				<RectButton accessible={false} accessibilityLabel={I18n.t('Hide')} style={styles.actionButton} onPress={onHidePress}>
					<View style={[styles.actionIconSlot, { width: iconSlotWidth }]}>
						<CustomIcon
							size={isCondensed ? CONDENSED_ICON_SIZE : EXPANDED_ICON_SIZE}
							name='unread-on-top-disabled'
							color={colors.fontWhite}
						/>
					</View>
				</RectButton>
			</Animated.View>
		</View>
	);
});
