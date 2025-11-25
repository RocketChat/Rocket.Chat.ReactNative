import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
	useAnimatedStyle,
	interpolate,
	withSpring,
	runOnJS,
	useAnimatedReaction,
	useSharedValue,
	type SharedValue
} from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { CustomIcon } from '../../CustomIcon';
import { useTheme } from '../../../theme';
import I18n from '../../../i18n';

export interface IDeleteActionProps {
	transX: SharedValue<number>;
	width: number;
	rowHeight: number;
	actionWidth: number;
	longSwipe: number;
	onDeletePress(): void;
	testID?: string;
}

const SERVER_ITEM_PADDING_VERTICAL = 12;

export const DeleteAction = React.memo(
	({ transX, width, rowHeight, actionWidth, longSwipe, onDeletePress, testID }: IDeleteActionProps) => {
		const { colors } = useTheme();

		const translateXDelete = useSharedValue(0);

		const triggerDeleteAnimation = (toValue: number) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			translateXDelete.value = withSpring(toValue, { overshootClamping: true, mass: 0.7 });
		};

		useAnimatedReaction(
			() => transX.value,
			(currentTransX, previousTransX) => {
				if (I18n.isRTL) {
					if (previousTransX && currentTransX > longSwipe && previousTransX <= longSwipe) {
						runOnJS(triggerDeleteAnimation)(actionWidth);
					} else if (previousTransX && currentTransX <= longSwipe && previousTransX > longSwipe) {
						runOnJS(triggerDeleteAnimation)(0);
					}
				} else if (previousTransX && currentTransX < -longSwipe && previousTransX >= -longSwipe) {
					runOnJS(triggerDeleteAnimation)(-actionWidth);
				} else if (previousTransX && currentTransX >= -longSwipe && previousTransX < -longSwipe) {
					runOnJS(triggerDeleteAnimation)(0);
				}
			}
		);

		const animatedDeleteButtonStyles = useAnimatedStyle(() => {
			if (I18n.isRTL) {
				// RTL: delete button appears from the left when swiping right
				if (transX.value > longSwipe && transX.value >= 2 * actionWidth) {
					const parallaxSwipe = interpolate(
						transX.value,
						[2 * actionWidth, longSwipe],
						[-actionWidth, -actionWidth - 0.1 * transX.value]
					);
					return {
						transform: [{ translateX: parallaxSwipe - translateXDelete.value }],
						left: 0,
						right: undefined
					};
				}
				return {
					transform: [{ translateX: transX.value - actionWidth - translateXDelete.value }],
					left: 0,
					right: undefined
				};
			}
			// LTR: delete button appears from the right when swiping left
			if (transX.value < -longSwipe && transX.value <= -2 * actionWidth) {
				const parallaxSwipe = interpolate(
					transX.value,
					[-2 * actionWidth, -longSwipe],
					[actionWidth, actionWidth + 0.1 * transX.value]
				);
				return {
					transform: [{ translateX: parallaxSwipe + translateXDelete.value }],
					right: 0,
					left: undefined
				};
			}
			return {
				transform: [{ translateX: transX.value + actionWidth + translateXDelete.value }],
				right: 0,
				left: undefined
			};
		});
		const viewHeight = { height: rowHeight + SERVER_ITEM_PADDING_VERTICAL };

		return (
			<View
				style={[styles.actionsLeftContainer, viewHeight, { backgroundColor: colors.buttonBackgroundDangerDefault }]}
				pointerEvents='box-none'>
				<Animated.View
					style={[
						styles.actionRightButtonContainer,
						{
							width
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
	}
);

const styles = StyleSheet.create({
	actionsLeftContainer: {
		flexDirection: 'row',
		position: 'absolute',
		left: 0,
		right: 0
	},
	actionRightButtonContainer: {
		position: 'absolute',
		justifyContent: 'center',
		top: 0,
		alignItems: 'flex-end'
	},
	actionButton: {
		width: 80,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
