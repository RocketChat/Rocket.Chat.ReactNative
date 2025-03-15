import React from 'react';
import Animated, {
	useAnimatedGestureHandler,
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	runOnJS
} from 'react-native-reanimated';
import {
	LongPressGestureHandler,
	PanGestureHandler,
	State,
	HandlerStateChangeEventPayload,
	PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';

import Touch from '../../Touch';
import { RightActions } from '../Actions';
import { ITouchableProps } from '../interfaces';
import { WIDTH } from '../styles';

const Touchable = ({
	children,
	onPress,
	onLongPress,
	disabled,
	onThreadPress,
	tmid,
	id,
	swipeEnabled,
	style
}: ITouchableProps): React.ReactElement => {
	const rowOffSet = useSharedValue(0);
	const transX = useSharedValue(0);
	const rowState = useSharedValue(0);
	let _value = 0;

	const close = () => {
		rowState.value = 0;
		transX.value = withSpring(0, { overshootClamping: true });
		rowOffSet.value = 0;
	};

	const handleLongPress = () => {
		if (rowState.value !== 0) {
			close();
			return;
		}

		if (onLongPress) {
			onLongPress();
		}
	};
	const handleThreadPress = () => {
		if (onThreadPress) {
			onThreadPress(tmid, id);
		}
	};
	const onLongPressHandlerStateChange = ({ nativeEvent }: { nativeEvent: HandlerStateChangeEventPayload }) => {
		if (disabled) return;
		if (nativeEvent.state === State.ACTIVE) {
			handleLongPress();
		}
	};
	const handleRelease = (event: PanGestureHandlerEventPayload) => {
		const { translationX } = event;
		_value += translationX;
		let toValue = 0;
		if (rowState.value === 0) {
			if (translationX < 0 && translationX > -WIDTH) {
				toValue = -WIDTH;
				rowState.value = 1;
			} else if (translationX <= -WIDTH) {
				toValue = 0;
				rowState.value = 0;
				handleThreadPress();
			} else {
				toValue = 0;
				rowState.value = 0;
			}
		} else if (rowState.value === 1) {
			if (_value > -100) {
				toValue = 0;
				rowState.value = 0;
			} else if (_value < -WIDTH) {
				handleThreadPress();
				toValue = 0;
				rowState.value = 0;
			}
		}
		transX.value = withSpring(toValue, {
			damping: 20,
			stiffness: WIDTH,
			overshootClamping: true
		});
		rowOffSet.value = toValue;
		_value = toValue;
	};
	const onGestureEvent = useAnimatedGestureHandler({
		onActive: event => {
			if (event.translationX <= 0 || rowState.value === 1) {
				transX.value = event.translationX + rowOffSet.value;

				if (transX.value < -2 * WIDTH) {
					transX.value = -2 * WIDTH;
				}

				if (rowState.value === 0 && transX.value > 0) {
					transX.value = 0;
				}
			}
		},
		onEnd: event => {
			runOnJS(handleRelease)(event);
		}
	});

	const animatedStyles = useAnimatedStyle(() => ({ transform: [{ translateX: transX.value }] }));

	return (
		<LongPressGestureHandler onHandlerStateChange={onLongPressHandlerStateChange}>
			<Animated.View>
				<PanGestureHandler activeOffsetX={[-20, 20]} onGestureEvent={onGestureEvent} enabled={!disabled && swipeEnabled}>
					<Animated.View>
						<RightActions transX={transX} handleThreadPress={handleThreadPress} />
						<Animated.View style={animatedStyles}>
							<Touch onPress={onPress} style={style}>
								{children}
							</Touch>
						</Animated.View>
					</Animated.View>
				</PanGestureHandler>
			</Animated.View>
		</LongPressGestureHandler>
	);
};

export default Touchable;
