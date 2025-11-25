import React, { memo } from 'react';

import SwipeableDeleteTouchable from './SwipeableDeleteItem/Touchable';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE, ROW_HEIGHT } from './styles';
import { useTheme } from '../../theme';

export interface IServerItemTouchableProps {
	children: JSX.Element;
	testID: string;
	width: number;
	onPress(): void;
	onDeletePress(): void;
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
};

export default memo(Touchable);
