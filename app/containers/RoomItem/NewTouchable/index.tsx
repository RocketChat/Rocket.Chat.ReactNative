import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { RectButton } from 'react-native-gesture-handler';

import { RightActions } from './RightAction';
import { LeftActions } from './LeftAction';
import { useTheme } from '../../../theme';
import { DisplayMode } from '../../../lib/constants';
import { ITouchableProps } from '../interfaces';

export default function SwipeableRow({
	children,
	type,
	onPress,
	onLongPress,
	testID,
	// width,
	favorite,
	isRead,
	rid,
	toggleFav,
	toggleRead,
	hideChannel,
	isFocused,
	swipeEnabled,
	displayMode
}: ITouchableProps) {
	const swipeableRef = useRef<SwipeableMethods>(null);
	const [currentSwipeDirection, setCurrentSwipeDirection] = useState<'left' | 'right' | null>(null);
	const { colors } = useTheme();

	const handleAction = useCallback(
		(action: 'favorite' | 'read' | 'hide') => {
			switch (action) {
				case 'favorite':
					toggleFav?.(rid, favorite);
					break;
				case 'read':
					toggleRead?.(rid, isRead);
					break;
				case 'hide':
					hideChannel?.(rid, type);
					break;
			}

			swipeableRef.current?.close();
		},
		[rid, toggleFav, toggleRead, type, favorite, isRead, hideChannel]
	);

	const onSwipeableWillOpen = useCallback((direction: 'left' | 'right') => {
		setCurrentSwipeDirection(direction);
	}, []);

	const onSwipeableOpen = useCallback(
		(direction: 'left' | 'right') => {
			if (direction === 'left') {
				handleAction('read');
			}
		},
		[handleAction]
	);

	const onSwipeableClose = useCallback(() => {
		setCurrentSwipeDirection(null);
	}, []);

	const renderLeftActions = useCallback(
		(progress: SharedValue<number>) => {
			if (currentSwipeDirection === 'right') {
				return <View />;
			}
			return (
				<LeftActions
					progress={progress}
					isCondensed={displayMode === DisplayMode.Condensed}
					isRead={isRead}
					handleAction={handleAction}
				/>
			);
		},
		[handleAction, displayMode, isRead, currentSwipeDirection]
	);

	const renderRightActions = useCallback(
		(progress: SharedValue<number>) => {
			if (currentSwipeDirection === 'left') {
				return <View />;
			}
			return (
				<RightActions
					progress={progress}
					favorite={favorite}
					isCondensed={displayMode === DisplayMode.Condensed}
					handleAction={handleAction}
				/>
			);
		},
		[handleAction, favorite, displayMode, currentSwipeDirection]
	);

	return (
		<Swipeable
			ref={swipeableRef}
			enabled={swipeEnabled}
			friction={1}
			overshootFriction={8}
			enableTrackpadTwoFingerGesture
			renderLeftActions={(_, progress) => renderLeftActions(progress)}
			renderRightActions={(_, progress) => renderRightActions(progress)}
			childrenContainerStyle={{ backgroundColor: isFocused ? colors.surfaceTint : colors.surfaceRoom }}
			onSwipeableWillOpen={onSwipeableWillOpen}
			onSwipeableOpen={onSwipeableOpen}
			onSwipeableClose={onSwipeableClose}>
			<RectButton onPress={onPress} onLongPress={onLongPress} testID={testID}>
				{children}
			</RectButton>
		</Swipeable>
	);
}
