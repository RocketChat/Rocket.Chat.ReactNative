import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
	useAnimatedGestureHandler,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
	runOnJS,
	interpolateColor
} from 'react-native-reanimated';

import { useTheme } from '../../../theme';
import { type TAnyMessageModel } from '../../../definitions';
import I18n from '../../../i18n';

const SWIPE_THRESHOLD = 80;
const BUTTON_WIDTH = 70;

interface SwipeableMessageProps {
	children: React.ReactNode;
	message: TAnyMessageModel;
	onReply: (message: TAnyMessageModel) => void;
	onEdit: (message: TAnyMessageModel) => void;
	onQuote: (message: TAnyMessageModel) => void;
	onThread: (message: TAnyMessageModel) => void;
	canEdit?: boolean;
	leftAction?: string;
}

const SwipeableMessage: React.FC<SwipeableMessageProps> = ({
	children,
	message,
	onReply,
	onEdit,
	onQuote,
	onThread,
	canEdit = false,
	leftAction = 'none'
}) => {
	const { colors } = useTheme();
	const translateX = useSharedValue(0);
	const gestureState = useSharedValue<number>(State.UNDETERMINED);

	const canEditMessage = canEdit && message.u?.username && !message.t;
	const canPerformSwipeAction = leftAction !== 'edit' || canEditMessage;

	const executeAction = (action: string) => {
		console.log('SwipeableMessage executeAction:', action, 'canEditMessage:', canEditMessage);
		switch (action) {
			case 'reply':
				onReply(message);
				break;
			case 'edit':
				console.log('Calling onEdit for message:', message.id);
				onEdit(message);
				break;
			case 'quote':
				onQuote(message);
				break;
			case 'thread':
				onThread(message);
				break;
			default:
				break;
		}
	};

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, context: any) => {
			context.startX = translateX.value;
		},
		onActive: (event, context: any) => {
			gestureState.value = event.state;
			
			// Only allow left swipe if user can perform the action
			if (event.translationX < 0 && canPerformSwipeAction) {
				// Left swipe
				if (leftAction !== 'none') {
					translateX.value = Math.max(event.translationX, -BUTTON_WIDTH);
				} else {
					translateX.value = 0;
				}
			} else {
				translateX.value = 0;
			}
		},
		onEnd: (event) => {
			gestureState.value = State.END;
			
			// Always snap back to original position for safety
			translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
			
			// Determine which action to trigger based on swipe direction and distance
			const swipeDistance = Math.abs(event.translationX);
			
			if (swipeDistance > SWIPE_THRESHOLD && event.translationX < 0 && canPerformSwipeAction && leftAction !== 'none') {
				// Left swipe action
				runOnJS(executeAction)(leftAction);
			}
		}
	});

	const resetSwipe = () => {
		try {
			translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
		} catch (error) {
			console.warn('Error resetting swipe:', error);
			translateX.value = 0;
		}
	};

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ 
				translateX: Math.max(translateX.value, -BUTTON_WIDTH)
			}]
		};
	});

	const buttonContainerStyle = useAnimatedStyle(() => {
		const opacity = translateX.value < 0 ? 1 : 0;
		return {
			opacity: withTiming(opacity),
			transform: [{ 
				translateX: translateX.value + BUTTON_WIDTH
			}]
		};
	});

	const replyButtonStyle = useAnimatedStyle(() => {
		const backgroundColor = interpolateColor(
			translateX.value,
			[-BUTTON_WIDTH, 0],
			[colors.buttonBackgroundPrimaryDefault || '#007AFF', colors.buttonBackgroundSecondaryDefault || '#F0F0F0']
		);
		return {
			backgroundColor: withTiming(backgroundColor)
		};
	});

	return (
		<GestureHandlerRootView style={styles.container}>
			{/* Action buttons */}
			<Animated.View style={[styles.buttonContainer, buttonContainerStyle]}>
				{/* Show action based on left swipe */}
				{leftAction !== 'none' && canPerformSwipeAction && (
					<TouchableOpacity
						style={[styles.actionButton, replyButtonStyle]}
						onPress={() => {
							try {
								executeAction(leftAction);
								resetSwipe();
							} catch (error) {
								console.warn('Error in left action:', error);
								resetSwipe();
							}
						}}
						activeOpacity={0.7}
					>
						<Text style={[styles.buttonText, { color: colors.buttonFontPrimary }]}>
							{leftAction === 'thread' ? I18n.t('Create_Thread') : leftAction.charAt(0).toUpperCase() + leftAction.slice(1)}
						</Text>
					</TouchableOpacity>
				)}
			</Animated.View>

			{/* Message content */}
			<PanGestureHandler onGestureEvent={gestureHandler}>
				<Animated.View style={[styles.content, animatedStyle]}>
					{children}
				</Animated.View>
			</PanGestureHandler>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		overflow: 'hidden'
	},
	buttonContainer: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		flexDirection: 'row',
		alignItems: 'center',
		zIndex: 1
	},
	actionButton: {
		width: BUTTON_WIDTH,
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 8
	},
	buttonText: {
		fontSize: 12,
		fontWeight: '600'
	},
	content: {
		backgroundColor: 'transparent',
		zIndex: 2
	}
});

export default SwipeableMessage;
