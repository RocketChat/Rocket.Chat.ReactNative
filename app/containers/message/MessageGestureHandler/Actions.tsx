import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RectButton } from 'react-native-gesture-handler';

import { CustomIcon } from '../../CustomIcon';
import styles, { WIDTH } from './styles';
import { IRightActionsProps } from './interfaces';
import { useTheme } from '../../../theme';

export const RightActions = React.memo(({ transX, handleThreadPress }: IRightActionsProps) => {
	const { colors } = useTheme();

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: transX.value }]
	}));

	return (
		<View style={[styles.actionsContainer, styles.actionsRightContainer]} pointerEvents='box-none'>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{ width: WIDTH * 2, backgroundColor: colors.badgeBackgroundLevel3, left: '100%' },
					animatedStyles
				]}>
				<View style={styles.actionRightButtonContainer}>
					<RectButton style={styles.actionButton} onPress={handleThreadPress}>
						<CustomIcon size={24} name={'threads'} color={colors.fontWhite} />
					</RectButton>
				</View>
			</Animated.View>
		</View>
	);
});
