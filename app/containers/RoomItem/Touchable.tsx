import { useEffect, useState, memo, type ReactElement } from 'react';
import { I18nManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction } from 'react-native-reanimated';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { runOnUISync, scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';

import Touch from '../Touch';
import { LeftActions, RightActions } from './Actions';
import { getFullSwipeThreshold, getSwipeRelease } from './utils/swipeRelease';
import { unregisterOpenSwipeItem, closeOpenSwipeItem, settleSwipeRow } from './utils/openSwipeItem';
import { type ITouchableProps } from './interfaces';
import { useTheme } from '~/theme';
import { toggleFav } from '~/lib/methods/toggleFav';
import { toggleRead } from '~/lib/methods/toggleRead';
import { hideRoom } from '~/lib/methods/hideRoom';
import { useAppSelector } from '~/lib/hooks/useAppSelector';

const rubberband = (overshoot: number, dimension: number, constant = 0.55) => {
	'worklet';
	return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
};

const triggerThresholdHaptic = () => {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const Touchable = ({
	children,
	type,
	onPress,
	onLongPress,
	width,
	favorite,
	isRead,
	rid,
	isFocused,
	swipeEnabled,
	displayMode
}: ITouchableProps): ReactElement => {
	const { colors } = useTheme();
	const serverVersion = useAppSelector(state => state.server.version);
	const direction = I18nManager.isRTL ? -1 : 1;
	const rowOffSet = useSharedValue(0);
	const transX = useSharedValue(0);
	const crossedFullSwipe = useSharedValue(false);
	const touchClosedOtherRow = useSharedValue(false);
	const [actionsMounted, setActionsMounted] = useState(false);
	const row = { rid, transX, rowOffSet };

	useAnimatedReaction(
		() => transX.value !== 0,
		(moved, previouslyMoved) => {
			if (previouslyMoved !== null && moved !== previouslyMoved) {
				scheduleOnRN(setActionsMounted, moved);
			}
		}
	);

	const close = () => settleSwipeRow(row, 0);

	useEffect(() => () => unregisterOpenSwipeItem(rid), [rid]);

	const handleToggleFav = () => {
		toggleFav(rid, favorite);
		close();
	};

	const toggleReadRoom = () => toggleRead(rid, isRead, serverVersion);

	const hideChannel = () => hideRoom(rid, type);

	const onToggleReadPress = () => {
		toggleReadRoom();
		close();
	};

	const onHidePress = () => {
		hideChannel();
		close();
	};

	const guardTouch = (action?: () => void) => () => {
		if (rowOffSet.value !== 0) {
			close();
			return;
		}
		if (touchClosedOtherRow.value || runOnUISync(closeOpenSwipeItem, rid)) {
			touchClosedOtherRow.value = false;
			return;
		}
		action?.();
	};

	const handlePress = guardTouch(onPress);

	const handleLongPress = guardTouch(onLongPress);

	const panGesture = usePanGesture({
		activeOffsetX: [-10, 10], // More sensitive horizontal detection
		failOffsetY: [-20, 20], // Fail on vertical movement to distinguish scrolling
		enabled: swipeEnabled,
		onBegin: () => {
			crossedFullSwipe.value = false;
			touchClosedOtherRow.value = closeOpenSwipeItem(rid);
		},
		onActivate: () => {
			scheduleOnRN(setActionsMounted, true);
		},
		onUpdate: event => {
			const next = rowOffSet.value + direction * event.translationX;
			const threshold = getFullSwipeThreshold(width);
			const overshoot = Math.abs(next) - threshold;
			transX.value = overshoot > 0 ? Math.sign(next) * (threshold + rubberband(overshoot, width)) : next;
			const crossed = overshoot >= 0;
			if (crossed !== crossedFullSwipe.value) {
				crossedFullSwipe.value = crossed;
				scheduleOnRN(triggerThresholdHaptic);
			}
		},
		onDeactivate: event => {
			const release = getSwipeRelease({
				restingOffset: rowOffSet.value,
				offset: rowOffSet.value + direction * event.translationX,
				width
			});
			settleSwipeRow(row, release.restingOffset, direction * event.velocityX);
			if (release.fullSwipe === 'left') {
				scheduleOnRN(toggleReadRoom);
			} else if (release.fullSwipe === 'right') {
				scheduleOnRN(hideChannel);
			}
		}
	});

	const animatedStyles = useAnimatedStyle(() => ({
		transform: [{ translateX: direction * transX.value }]
	}));

	return (
		<GestureDetector gesture={panGesture}>
			<Animated.View>
				{actionsMounted ? (
					<>
						<LeftActions
							transX={transX}
							isRead={isRead}
							width={width}
							onToggleReadPress={onToggleReadPress}
							displayMode={displayMode}
						/>
						<RightActions
							transX={transX}
							favorite={favorite}
							width={width}
							toggleFav={handleToggleFav}
							onHidePress={onHidePress}
							displayMode={displayMode}
						/>
					</>
				) : null}
				<Animated.View style={animatedStyles}>
					<Touch
						onPress={handlePress}
						onLongPress={handleLongPress}
						style={{
							backgroundColor: isFocused ? colors.surfaceTint : colors.surfaceRoom
						}}>
						{children}
					</Touch>
				</Animated.View>
			</Animated.View>
		</GestureDetector>
	);
};

export default memo(Touchable);
