import React from 'react';
import { View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	interpolate,
	withSpring,
	runOnJS,
	useAnimatedReaction,
	useSharedValue,
	SharedValue
} from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { CustomIcon } from '../../../../containers/CustomIcon';
import styles, { ACTION_WIDTH, LONG_SWIPE, ROW_HEIGHT } from './styles';
import { useTheme } from '../../../../theme';
import I18n from '../../../../i18n';

export interface IDeleteActionProps {
	transX: SharedValue<number>;
	width: number;
	onDeletePress(): void;
	testID?: string;
}

export const DeleteAction = React.memo(({ transX, width, onDeletePress, testID }: IDeleteActionProps) => {
	const { colors } = useTheme();

	const translateXDelete = useSharedValue(0);

	const triggerDeleteAnimation = (toValue: number) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		translateXDelete.value = withSpring(toValue, { overshootClamping: true, mass: 0.7 });
	};

	useAnimatedReaction(
		() => transX.value,
		(currentTransX, previousTransX) => {
			// Triggers the animation and hapticFeedback if swipe reaches/unreaches the threshold.
			if (I18n.isRTL) {
				if (previousTransX && currentTransX > LONG_SWIPE && previousTransX <= LONG_SWIPE) {
					runOnJS(triggerDeleteAnimation)(ACTION_WIDTH);
				} else if (previousTransX && currentTransX <= LONG_SWIPE && previousTransX > LONG_SWIPE) {
					runOnJS(triggerDeleteAnimation)(0);
				}
			} else if (previousTransX && currentTransX < -LONG_SWIPE && previousTransX >= -LONG_SWIPE) {
				runOnJS(triggerDeleteAnimation)(-ACTION_WIDTH);
			} else if (previousTransX && currentTransX >= -LONG_SWIPE && previousTransX < -LONG_SWIPE) {
				runOnJS(triggerDeleteAnimation)(0);
			}
		}
	);

	const animatedDeleteButtonStyles = useAnimatedStyle(() => {
		if (I18n.isRTL) {
			if (transX.value < LONG_SWIPE && transX.value >= 2 * ACTION_WIDTH) {
				const parallaxSwipe = interpolate(
					transX.value,
					[2 * ACTION_WIDTH, LONG_SWIPE],
					[ACTION_WIDTH, ACTION_WIDTH + 0.1 * transX.value]
				);
				return { transform: [{ translateX: parallaxSwipe + translateXDelete.value }] };
			}
			return { transform: [{ translateX: transX.value - ACTION_WIDTH + translateXDelete.value }] };
		}
		if (transX.value > -LONG_SWIPE && transX.value <= -2 * ACTION_WIDTH) {
			const parallaxSwipe = interpolate(
				transX.value,
				[-2 * ACTION_WIDTH, -LONG_SWIPE],
				[-ACTION_WIDTH, -ACTION_WIDTH + 0.1 * transX.value]
			);
			return { transform: [{ translateX: parallaxSwipe + translateXDelete.value }] };
		}
		return { transform: [{ translateX: transX.value + ACTION_WIDTH + translateXDelete.value }] };
	});

	const viewHeight = { height: ROW_HEIGHT };

	return (
		<View style={[styles.actionsLeftContainer, viewHeight]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width: width * 2,
						backgroundColor: colors.buttonBackgroundDangerDefault,
						left: '100%'
					},
					viewHeight,
					animatedDeleteButtonStyles
				]}>
				<RectButton
					accessible
					accessibilityLabel={I18n.t('Delete')}
					testID={testID}
					style={[styles.actionButton, { backgroundColor: colors.buttonBackgroundDangerDefault }]}
					onPress={onDeletePress}>
					<CustomIcon size={24} name='delete' color={colors.fontWhite} />
				</RectButton>
			</Animated.View>
		</View>
	);
});
