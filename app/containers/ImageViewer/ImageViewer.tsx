import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, StyleProp, ViewStyle, ImageStyle, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
	withTiming,
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	SharedValue,
	runOnJS
} from 'react-native-reanimated';
import Touchable from 'react-native-platform-touchable';
import { shallowEqual } from 'react-redux';

import { useTheme } from '../../theme';
import { ImageComponent } from './ImageComponent';
import { IImageData, ImageProps } from './ImageCarousal';
import { useAppNavigation } from '../../lib/hooks/navigation';
import { CustomIcon } from '../CustomIcon/index';
import sharedStyles from '../../views/Styles';
import { handleSave } from '../../views/AttachmentView';
import RCActivityIndicator from '../ActivityIndicator';
import { useAppSelector } from '../../lib/hooks';
import { isImageBase64 } from '../../lib/methods';
import { getUserSelector } from '../../selectors/login';

interface ImageViewerProps extends ImageProps {
	style?: StyleProp<ImageStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	imageContainerStyle?: StyleProp<ViewStyle>;

	item: IImageData;
	translateOuterX: SharedValue<number>;
	offsetOuterX: SharedValue<number>;
	currItem: SharedValue<number>;
	size: number;
	showHeader: boolean;
}

const styles = StyleSheet.create({
	flex: {
		flex: 1
	},
	image: {
		flex: 1
	},
	header: {
		position: 'absolute',
		zIndex: 1,
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 10
	},
	text: {
		...sharedStyles.textMedium
	}
});

export const ImageViewer = ({
	item,
	imageComponentType,
	width,
	height,
	translateOuterX,
	offsetOuterX,
	currItem,
	size,
	showHeader,
	...props
}: ImageViewerProps): React.ReactElement => {
	console.log(props);
	const [centerX, setCenterX] = useState(0);
	const [centerY, setCenterY] = useState(0);
	const [loading, setLoading] = useState(false);
	const [isHeaderVisible, setIsHeaderVisible] = useState(showHeader);

	const WIDTH_OFFSET = -width;
	const OUTER_EDGE_PAN = 100; // how much to translate when panned on both edges of the outer view

	const onLayout = ({
		nativeEvent: {
			layout: { x, y, width, height }
		}
	}: LayoutChangeEvent) => {
		setCenterX(x + width / 2);
		setCenterY(y + height / 2);
	};

	const translationX = useSharedValue<number>(0);
	const eventTranslationX = useSharedValue<number>(0);
	const translationY = useSharedValue<number>(0);
	const offsetX = useSharedValue<number>(0);
	const offsetY = useSharedValue<number>(0);
	const scale = useSharedValue<number>(1);
	const scaleOffset = useSharedValue<number>(1);

	const style = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: translationX.value
			},
			{
				translateY: translationY.value
			},
			{
				scale: scale.value
			}
		]
	}));

	const resetScaleAnimation = () => {
		'worklet';

		scaleOffset.value = 1;
		offsetOuterX.value = WIDTH_OFFSET * currItem.value;
		offsetX.value = 0;
		offsetY.value = 0;
		scale.value = withSpring(1);
		translationX.value = withSpring(0, {
			overshootClamping: true
		});
		translateOuterX.value = withSpring(WIDTH_OFFSET * currItem.value, {
			overshootClamping: true
		});
		translationY.value = withSpring(0, {
			overshootClamping: true
		});
	};

	const clamp = (value: number, min: number, max: number) => {
		'worklet';

		return Math.max(Math.min(value, max), min);
	};

	const pinchGesture = Gesture.Pinch()
		.onUpdate(event => {
			scale.value = clamp(scaleOffset.value * (event.scale > 0 ? event.scale : 1), 1, 4);
		})
		.onEnd(() => {
			scaleOffset.value = scale.value > 0 ? scale.value : 1;
		});

	const panGesture = Gesture.Pan()
		.maxPointers(2)
		.onStart(() => {
			translateOuterX.value = offsetOuterX.value;
			translationX.value = offsetX.value;
			translationY.value = offsetY.value;
			eventTranslationX.value = 0;
		})
		.onUpdate(event => {
			const scaleFactor = scale.value - 1;

			translationX.value = clamp(event.translationX + offsetX.value, -scaleFactor * centerX, scaleFactor * centerX);
			translationY.value = clamp(event.translationY + offsetY.value, -scaleFactor * centerY, scaleFactor * centerY);

			// when edge is reached
			if (translationX.value === scaleFactor * centerX || translationX.value === -scaleFactor * centerX) {
				translateOuterX.value = clamp(
					event.translationX - eventTranslationX.value + offsetOuterX.value,
					WIDTH_OFFSET * (size - 1) - OUTER_EDGE_PAN,
					OUTER_EDGE_PAN
				);
			} else {
				eventTranslationX.value = event.translationX; // to get finger moved value after reaching inner edge
			}
		})
		.onEnd(() => {
			const diff = translateOuterX.value - WIDTH_OFFSET * currItem.value; // diff between outer position and outer translation
			const scrollOffset = centerX / 2; // on how much pan go to next image

			// only when outer translate value is changed
			if (diff) {
				let isChanged = true;
				if (diff < -scrollOffset && currItem.value + 1 < size) {
					currItem.value += 1;
				} else if (diff > scrollOffset && currItem.value - 1 >= 0) {
					currItem.value -= 1;
				} else {
					isChanged = false;
				}
				translateOuterX.value = withSpring(WIDTH_OFFSET * currItem.value, { overshootClamping: true });
				offsetOuterX.value = WIDTH_OFFSET * currItem.value;
				if (isChanged) {
					resetScaleAnimation();
					return;
				}
			}

			offsetX.value = translationX.value;
			offsetY.value = translationY.value;
			if (scale.value === 1) resetScaleAnimation();
		});

	const doubleTapGesture = Gesture.Tap()
		.numberOfTaps(2)
		.maxDelay(120)
		.maxDistance(70)
		.onEnd(event => {
			if (scaleOffset.value > 1) resetScaleAnimation();
			else {
				scale.value = withTiming(2, {
					duration: 200
				});
				translationX.value = withTiming(centerX - event.x, {
					duration: 200
				});
				offsetX.value = centerX - event.x;
				scaleOffset.value = 2;
			}
		});

	const toggleHeader = () => setIsHeaderVisible(s => !s);

	const singleTapGesture = Gesture.Tap()
		.requireExternalGestureToFail(doubleTapGesture)
		.onEnd(() => {
			if (showHeader) {
				runOnJS(toggleHeader)();
			}
		});

	const gesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture, singleTapGesture);

	const Component = ImageComponent({ type: imageComponentType, uri: item.uri });

	const { colors } = useTheme();

	const navigation = useAppNavigation();

	const { baseUrl, user, Allow_Save_Media_to_Gallery } = useAppSelector(
		state => ({
			baseUrl: state.server.server,
			user: { id: getUserSelector(state).id, token: getUserSelector(state).token },
			Allow_Save_Media_to_Gallery: (state.settings.Allow_Save_Media_to_Gallery as boolean) ?? true
		}),
		shallowEqual
	);

	return (
		<View
			style={[
				styles.flex,
				{
					width,
					height,
					overflow: 'hidden',
					paddingHorizontal: 5,
					backgroundColor: colors.previewBackground
				}
			]}
		>
			{isHeaderVisible && (
				<View style={[styles.header, { width, backgroundColor: colors.previewBackground }]}>
					<Touchable onPress={navigation.goBack}>
						<CustomIcon name={'arrow-back'} size={25} color={colors.previewTintColor} />
					</Touchable>

					<Text numberOfLines={1} style={[styles.text, { color: colors.previewTintColor, maxWidth: '60%' }]}>
						{decodeURI(item.title as string) || ''}
					</Text>

					{Allow_Save_Media_to_Gallery && !isImageBase64(item.uri) && (
						<Touchable
							onPress={() =>
								handleSave({ image_url: item.uri, title: item.title, image_type: item.image_type }, user, baseUrl, setLoading)
							}
						>
							<CustomIcon name={'download'} size={25} color={colors.previewTintColor} />
						</Touchable>
					)}
				</View>
			)}
			<GestureDetector gesture={gesture}>
				<Animated.View onLayout={onLayout} style={[styles.flex, style]}>
					<Component
						// @ts-ignore
						style={styles.image}
						resizeMode='contain'
						source={{ uri: item.uri }}
						{...props}
					/>
				</Animated.View>
			</GestureDetector>
			{loading ? <RCActivityIndicator absolute size='large' /> : null}
		</View>
	);
};
