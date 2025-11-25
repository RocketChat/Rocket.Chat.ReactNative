import React, { memo } from 'react';

import SwipeableDeleteTouchable from './SwipeableDeleteItem/Touchable';
import Touch from '../Touch';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE, ROW_HEIGHT } from './styles';
import { useTheme } from '../../theme';

export interface IServerItemTouchableProps {
	children: JSX.Element;
	testID: string;
	width: number;
	onPress(): void;
	onDeletePress?(): void;
	accessibilityLabel?: string;
	accessibilityHint?: string;
}

const Touchable = ({
	width,
	children,
	testID,
	onPress,
	onDeletePress,
	accessibilityLabel,
	accessibilityHint
}: IServerItemTouchableProps): React.ReactElement => {
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
			accessibilityHint={accessibilityHint}>
			{children}
		</Touch>
	);
};

export default memo(Touchable);
