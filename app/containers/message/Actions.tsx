import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../CustomIcon';
import styles, { WIDTH } from './styles';
import { IRightActionsProps } from './interfaces';
import { useTheme } from '../../theme';

export const RightActions = React.memo(({ transX, handleThreadPress }: IRightActionsProps) => {
	const { colors } = useTheme();

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	const buttonAnimatedStyle = useAnimatedStyle(() => {
		const progress = Math.min(1, Math.abs(transX.value) / (WIDTH * 0.5));

		const scale = interpolate(progress, [0, 1], [1, 1.3], Extrapolation.CLAMP);
		const opacity = interpolate(progress, [0, 0.5, 1], [0.8, 0.9, 1], Extrapolation.CLAMP);

		return {
			transform: [{ scale }],
			opacity
		};
	});

	return (
		<View style={[styles.actionsContainer, styles.actionsRightContainer]} pointerEvents='box-none'>
			<Animated.View style={[styles.actionRightButtonContainer, { width: WIDTH * 2, left: '100%' }, animatedStyles]}>
				<Animated.View style={styles.actionRightButtonContainer}>
					<Animated.View style={buttonAnimatedStyle}>
						<RectButton
							style={[
								styles.actionButton,
								{
									backgroundColor: colors.surfaceTint
								}
							]}
							onPress={handleThreadPress}>
							<CustomIcon size={20} name={'arrow-back'} color={colors.surfaceDark} />
						</RectButton>
					</Animated.View>
				</Animated.View>
			</Animated.View>
		</View>
	);
});
