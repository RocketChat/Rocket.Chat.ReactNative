import React, { memo } from 'react';

import { SwipeableDeleteTouchable } from '../SwipeableDeleteItem';
import { ACTION_WIDTH, LONG_SWIPE, SMALL_SWIPE, ROW_HEIGHT } from './styles';
import { useTheme } from '../../theme';

export interface IServerItemTouchableProps {
	children: JSX.Element;
	testID: string;
	width: number;
	onPress(): void;
	onDeletePress(): void;
}

const Touchable = ({ width, children, testID, onPress, onDeletePress }: IServerItemTouchableProps): React.ReactElement => {
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
