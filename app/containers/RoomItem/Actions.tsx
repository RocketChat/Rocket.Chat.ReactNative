import { memo } from 'react';
import { View } from 'react-native';
import Animated, {
	type SharedValue,
	useAnimatedStyle,
	useAnimatedReaction,
	useDerivedValue,
	useSharedValue,
	withTiming
} from 'react-native-reanimated';

import { RectButton } from '~/containers/GestureButtons';
import { CustomIcon } from '../CustomIcon';
import { DisplayMode } from '~/lib/constants/constantDisplayMode';
import styles from './styles';
import { getActionWidth, getFullSwipeThreshold } from './swipeRelease';
import { type ILeftActionsProps, type IRightActionsProps } from './interfaces';
import { useTheme } from '~/theme';
import I18n from '~/i18n';
import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';

const CONDENSED_ICON_SIZE = 24;
const EXPANDED_ICON_SIZE = 28;
const EXPAND_DURATION = 300;

const useHideExpandProgress = (transX: SharedValue<number>, width: number) => {
	const fullSwipeThreshold = getFullSwipeThreshold(width);
	const expandProgress = useSharedValue(0);

	useAnimatedReaction(
		() => -transX.value >= fullSwipeThreshold,
		(isCrossed, wasCrossed) => {
			if (isCrossed !== wasCrossed) {
				expandProgress.value = withTiming(isCrossed ? 1 : 0, { duration: EXPAND_DURATION });
			}
		}
	);

	return expandProgress;
};

export const LeftActions = memo(({ transX, isRead, width, onToggleReadPress, displayMode }: ILeftActionsProps) => {
	const { colors } = useTheme();

	const { rowHeight, rowHeightCondensed } = useResponsiveLayout();

	const actionWidth = getActionWidth(width);

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
					{ backgroundColor: colors.badgeBackgroundLevel2 },
					viewHeight,
					animatedButtonStyles
				]}>
				<RectButton
					accessible={false}
					accessibilityLabel={I18n.t(isRead ? 'Mark_unread' : 'Mark_read')}
					style={[styles.actionButton, styles.actionButtonContentEnd]}
					onPress={onToggleReadPress}>
					<View style={[styles.actionIconSlot, { width: actionWidth }]}>
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

	const actionWidth = getActionWidth(width);
	const expandProgress = useHideExpandProgress(transX, width);

	const buttonWidths = useDerivedValue(() => {
		const reveal = Math.max(-transX.value, 0);
		const favorite = (reveal / 2) * (1 - expandProgress.value);
		return { favorite, hide: reveal - favorite };
	});

	const animatedFavStyles = useAnimatedStyle(() => ({
		width: buttonWidths.value.favorite,
		right: buttonWidths.value.hide
	}));

	const animatedHideStyles = useAnimatedStyle(() => ({
		width: buttonWidths.value.hide
	}));

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
					<View style={[styles.actionIconSlot, { width: actionWidth }]}>
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
					<View style={[styles.actionIconSlot, { width: actionWidth }]}>
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
