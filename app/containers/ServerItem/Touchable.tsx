import { memo, type ReactElement } from 'react';
import type { AccessibilityRole } from 'react-native';

import SwipeableDeleteTouchable from './SwipeableDeleteItem/Touchable';
import Touch from '../Touch';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE, ROW_HEIGHT } from './styles';
import { useTheme } from '../../theme';

export interface IServerItemTouchableProps {
	children: ReactElement;
	testID: string;
	width: number;
	onPress(): void;
	onDeletePress?(): void;
	accessibilityLabel?: string;
	accessibilityHint?: string;
	accessibilityRole?: AccessibilityRole;
}

const Touchable = ({
	width,
	children,
	testID,
	onPress,
	onDeletePress,
	accessibilityLabel,
	accessibilityHint,
	accessibilityRole = 'button'
}: IServerItemTouchableProps): ReactElement => {
	const { colors } = useTheme();

	if (onDeletePress) {
		return (
			<SwipeableDeleteTouchable
				width={width}
				testID={testID}
				rowHeight={ROW_HEIGHT}
				actionWidth={ACTION_WIDTH}
				longSwipe={LONG_SWIPE}
				smallSwipe={SMALL_SWIPE}
				backgroundColor={colors.surfaceLight}
				onPress={onPress}
				onDeletePress={onDeletePress}
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={accessibilityHint}>
				{children}
			</SwipeableDeleteTouchable>
		);
	}

	return (
		<Touch
			onPress={onPress}
			testID={testID}
			style={{ backgroundColor: colors.surfaceLight }}
			accessible
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			accessibilityRole={accessibilityRole}>
			{children}
		</Touch>
	);
};

export default memo(Touchable);
