import React, { memo } from 'react';

import { SwipeableDeleteTouchable } from '../../../../containers/SwipeableDeleteItem';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE, ROW_HEIGHT } from './styles';
import { useTheme } from '../../../../theme';

export interface IServersHistoryItemTouchableProps {
	children: JSX.Element;
	testID: string;
	width: number;
	onPress(): void;
	onDeletePress(): void;
}

const Touchable = ({
	children,
	testID,
	width,
	onPress,
	onDeletePress
}: IServersHistoryItemTouchableProps): React.ReactElement => {
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
			onDeletePress={onDeletePress}>
			{children}
		</SwipeableDeleteTouchable>
	);
};

export default memo(Touchable);
