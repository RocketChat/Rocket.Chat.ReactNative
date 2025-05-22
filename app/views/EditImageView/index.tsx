import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SaveFormat, useImageManipulator } from 'expo-image-manipulator';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { RouteProp } from '@react-navigation/native';

import { InsideStackParamList } from '../../stacks/types';
import Cell from './components/Cell';
import EditOptionsBar from './components/EditOptionsBar';
import Row from './components/Row';

// To Do:
// - action sheet of resize;
// - Add Pinch detector;
// - Test horizontal device;
// - Organize code;
// - Adjust the layout;

// Components:
// - Grid;
// - EditTable;

// Hooks:
// - useImageManipulator;

interface IEditImageViewProps {
	navigation: NativeStackNavigationProp<InsideStackParamList, 'EditImageView'>;
	route: RouteProp<InsideStackParamList, 'EditImageView'>;
}

const EditImageView = ({ navigation, route }: IEditImageViewProps) => {
	const params = route?.params as any;
	const firstImage = params.attachments[0];
	const [crop, setCrop] = useState(false);
	const [originalImageSize, setOriginalImageSize] = useState<any>({ width: firstImage?.width, height: firstImage?.height });
	const [editableImage, setEditableImage] = useState(firstImage?.image_url ?? '');
	const context = useImageManipulator(editableImage);
	const { width, height: screenHeight } = useWindowDimensions();
	const imageSizeWidth = useSharedValue(originalImageSize.width);
	const imageSizeHeight = useSharedValue(originalImageSize.height);
	const height = imageSizeHeight.value;

	const defineImageSize = (originalWidth?: number, originalHeight?: number) => {
		if (!originalWidth || !originalHeight) return;
		const limitHeight = screenHeight * 0.5;

		const widthScale = width / originalWidth;
		let newWidth = width;
		let newHeight = originalHeight * widthScale;

		if (newHeight > limitHeight) {
			const heightScale = limitHeight / originalHeight;
			newHeight = limitHeight;
			newWidth = originalWidth * heightScale;
		}

		sharedValueWidth.value = newWidth;
		sharedValueHeight.value = newHeight;
		left.value = (width - newWidth) / 2;
		top.value = 0;
		imageSizeWidth.value = withTiming(newWidth);
		imageSizeHeight.value = withTiming(newHeight);
	};

	const rotateLeft = async () => {
		context.rotate(-90);
		const image = await context.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		setEditableImage(result.uri);
		defineImageSize(result.width, result.height);
	};

	const rotateRight = async () => {
		context.rotate(90);
		const image = await context.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		setEditableImage(result.uri);

		defineImageSize(result.width, result.height);
	};

	const getValueBasedOnOriginal = (cuttedValue: number, originalSize: number, screenScale: number) => {
		const escala = originalSize / screenScale;
		return cuttedValue * escala;
	};

	const onCancel = () => {
		navigation.goBack();
	};

	const onCrop = async () => {
		const finalWidth = getValueBasedOnOriginal(sharedValueWidth.value, originalImageSize.width, imageSizeWidth.value);
		const finalHeight = getValueBasedOnOriginal(sharedValueHeight.value, originalImageSize.height, imageSizeHeight.value);
		const originX = getValueBasedOnOriginal(left.value - getHorizontalPadding(), originalImageSize.width, imageSizeWidth.value);
		const originY = getValueBasedOnOriginal(top.value, originalImageSize.height, imageSizeHeight.value);

		context.crop({
			height: finalHeight,
			width: finalWidth,
			originX,
			originY
		});
		const image = await context.renderAsync();
		const result = await image.saveAsync({
			format: SaveFormat.PNG
		});

		setOriginalImageSize({ width: finalWidth, height: finalHeight });
		defineImageSize(finalWidth, finalHeight);
		setEditableImage(result.uri);
		setCrop(false);
		imageSizeWidth.value = withTiming(finalWidth);
		imageSizeHeight.value = withTiming(finalHeight);
	};

	const getHorizontalPadding = () => {
		const spaceToAlign = width - imageSizeWidth.value;
		return spaceToAlign / 2;
	};

	const sharedValueWidth = useSharedValue(width);
	const sharedValueHeight = useSharedValue(height);
	const top = useSharedValue(0);
	const left = useSharedValue(0);
	const prevTranslationXValue = useSharedValue(0);
	const prevTranslationYValue = useSharedValue(0);
	const prevScaleValue = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		width: sharedValueWidth.value,
		height: sharedValueHeight.value,
		transform: [{ translateX: left.value }, { translateY: top.value }],
		backgroundColor: 'rgba(0, 0, 0, .4)',
		position: 'absolute',
		borderWidth: 1,
		borderColor: 'white',
		alignItems: 'center',
		justifyContent: 'center'
	}));

	const pinch = Gesture.Pinch()
		.onStart(() => {})
		.onChange(e => {
			if (e.scale < 1 || e.scale < prevScaleValue.value) {
				const newWidth = sharedValueWidth.value - sharedValueWidth.value * e.scale;
				const newHeight = sharedValueHeight.value - sharedValueHeight.value * e.scale;
				if (newHeight < 100 || newWidth < 50) return;
				console.log(e);
				sharedValueHeight.value = newHeight;
				sharedValueWidth.value = newWidth;
				left.value += e.scale;
				top.value += e.scale;
			} else {
				console.log('aumentando tamanho');
			}

			prevScaleValue.value = e.scale;
		})
		.onEnd(() => {
			prevScaleValue.value = 0;
		});

	const topLeft = Gesture.Pan()
		.onChange(e => {
			// discover the value that moved;
			const verticalOffset = e.translationY - prevTranslationYValue.value;
			// discover the new height based on translation;
			const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
			// add the value on topValue and add a clamp to limit it;
			const newTop = clamp(top.value + verticalOffset, 0, height - newHeight);

			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const horizontalOffset = e.translationX - prevTranslationXValue.value;
			const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationXValue.value), 100, imageSizeWidth.value);
			const newLeft = clamp(
				paddingHorizontal + left.value + horizontalOffset,
				paddingHorizontal,
				width - newWidth - paddingHorizontal
			);

			if (newTop > 0) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
				top.value = newHeight > height * 0.999 ? 0 : newTop;
			}

			if (newLeft > 0) {
				sharedValueWidth.value = newWidth > width * 0.999 ? width : newWidth;
				left.value = newWidth > width * 0.999 ? paddingHorizontal : newLeft;
			}

			prevTranslationYValue.value = e.translationY;
			prevTranslationXValue.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationYValue.value = 0;
			prevTranslationXValue.value = 0;
		});
	const topCenter = Gesture.Pan()
		.onChange(e => {
			const offset = e.translationY - prevTranslationYValue.value;
			const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
			const newTop = clamp(top.value + offset, 0, height - newHeight);

			if (newTop > 0) {
				sharedValueHeight.value = newHeight;
				top.value = newTop;
			}

			prevTranslationYValue.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationYValue.value = 0;
		});
	const topRight = Gesture.Pan()
		.onChange(e => {
			const verticalOffset = e.translationY - prevTranslationYValue.value;
			const newHeight = clamp(sharedValueHeight.value - (e.translationY - prevTranslationYValue.value), 30, height);
			const newTop = clamp(top.value + verticalOffset, 0, height - newHeight);
			const horizontalOffset = e.translationX * -1 + prevTranslationXValue.value;
			const newWidth = clamp(sharedValueWidth.value - horizontalOffset, 100, imageSizeWidth.value);

			if (newTop > 0) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
				top.value = newHeight > height * 0.999 ? 0 : newTop;
			}

			if (newWidth + left.value < width) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
			}

			prevTranslationYValue.value = e.translationY;
			prevTranslationXValue.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationYValue.value = 0;
			prevTranslationXValue.value = 0;
		});

	const leftCenter = Gesture.Pan()
		.onChange(e => {
			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const offset = e.translationX - prevTranslationXValue.value;
			const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationXValue.value), 100, imageSizeWidth.value);
			const newLeft = clamp(paddingHorizontal + left.value + offset, paddingHorizontal, width - newWidth - paddingHorizontal);
			if (newLeft > 0) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
				left.value = newWidth > imageSizeWidth.value * 0.999 ? paddingHorizontal : newLeft;
			}

			prevTranslationXValue.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationXValue.value = 0;
		});
	const moveGrid = Gesture.Pan()
		.onChange(e => {
			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const offset = e.translationX - prevTranslationXValue.value;
			const verticalOffset = e.translationY - prevTranslationYValue.value;
			const newLeft = clamp(
				left.value + offset,
				paddingHorizontal,
				imageSizeWidth.value + paddingHorizontal - sharedValueWidth.value
			);
			const newTop = clamp(top.value + verticalOffset, 0, height - sharedValueHeight.value);
			if (sharedValueWidth.value < imageSizeWidth.value) {
				left.value = newLeft;
			}

			if (sharedValueHeight.value < height) {
				top.value = newTop;
			}

			prevTranslationXValue.value = e.translationX;
			prevTranslationYValue.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationXValue.value = 0;
			prevTranslationYValue.value = 0;
		});
	const rightCenter = Gesture.Pan()
		.onChange(e => {
			const offset = e.translationX * -1 + prevTranslationXValue.value;
			const newWidth = clamp(sharedValueWidth.value - offset, 100, imageSizeWidth.value);
			if (newWidth + left.value < width) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
			}
			prevTranslationXValue.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationXValue.value = 0;
		});

	const bottomLeft = Gesture.Pan()
		.onChange(e => {
			const paddingHorizontal = (width - imageSizeWidth.value) / 2;
			const horizontalOffset = e.translationX - prevTranslationXValue.value;
			const newWidth = clamp(sharedValueWidth.value - (e.translationX - prevTranslationXValue.value), 100, imageSizeWidth.value);
			const newLeft = clamp(
				paddingHorizontal + left.value + horizontalOffset,
				paddingHorizontal,
				width - newWidth - paddingHorizontal
			);

			const offset = e.translationY * -1 + prevTranslationYValue.value;
			const newHeight = clamp(sharedValueHeight.value - offset, 30, height);

			if (newHeight + top.value < height) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}

			if (newLeft > 0) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
				left.value = newWidth > imageSizeWidth.value * 0.999 ? paddingHorizontal : newLeft;
			}

			prevTranslationYValue.value = e.translationY;
			prevTranslationXValue.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationYValue.value = 0;
			prevTranslationXValue.value = 0;
		});
	const bottomCenter = Gesture.Pan()
		.onChange(e => {
			const offset = e.translationY * -1 + prevTranslationYValue.value;
			const newHeight = clamp(sharedValueHeight.value - offset, 30, height);
			if (newHeight + top.value < height) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}
			prevTranslationYValue.value = e.translationY;
		})
		.onFinalize(() => {
			prevTranslationYValue.value = 0;
		});
	const bottomRight = Gesture.Pan()
		.onChange(e => {
			const horizontalOffset = e.translationX * -1 + prevTranslationXValue.value;
			const newWidth = clamp(sharedValueWidth.value - horizontalOffset, 100, imageSizeWidth.value);
			const offset = e.translationY * -1 + prevTranslationYValue.value;
			const newHeight = clamp(sharedValueHeight.value - offset, 30, height);
			if (newHeight + top.value < height) {
				sharedValueHeight.value = newHeight > height * 0.999 ? height : newHeight;
			}
			if (newWidth + left.value < width) {
				sharedValueWidth.value = newWidth > imageSizeWidth.value * 0.999 ? imageSizeWidth.value : newWidth;
			}

			prevTranslationYValue.value = e.translationY;
			prevTranslationXValue.value = e.translationX;
		})
		.onFinalize(() => {
			prevTranslationYValue.value = 0;
			prevTranslationXValue.value = 0;
		});

	const composedGesture = Gesture.Exclusive(
		pinch,
		topLeft,
		topCenter,
		topRight,
		leftCenter,
		moveGrid,
		rightCenter,
		bottomLeft,
		bottomCenter,
		bottomRight
	);

	useEffect(() => {
		setEditableImage(firstImage?.path);
		defineImageSize(firstImage.width, firstImage.height);
	}, [params]);

	const imageAnimatedStyle = useAnimatedStyle(() => ({
		width: imageSizeWidth.value,
		height: imageSizeHeight.value
	}));

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<GestureDetector gesture={composedGesture}>
					<View style={{ paddingHorizontal: getHorizontalPadding() }}>
						<Animated.Image source={{ uri: editableImage }} style={imageAnimatedStyle} />

						{editableImage && crop ? (
							<Animated.View style={animatedStyle}>
								<Row>
									<Cell gesture={topLeft} />
									<Cell gesture={topCenter} />
									<Cell gesture={topRight} />
								</Row>

								<Row>
									<Cell gesture={leftCenter} />
									<Cell gesture={moveGrid} />
									<Cell gesture={rightCenter} />
								</Row>

								<Row>
									<Cell gesture={bottomLeft} />
									<Cell gesture={bottomCenter} />
									<Cell gesture={bottomRight} />
								</Row>
							</Animated.View>
						) : null}
					</View>
				</GestureDetector>
			</View>

			<EditOptionsBar
				crop={onCrop}
				isCropping={crop}
				onCancel={onCancel}
				onCancelCrop={() => setCrop(false)}
				onContinue={async () => {}}
				openResizeOptions={() => {}}
				rotateLeft={rotateLeft}
				rotateRight={rotateRight}
				startCrop={() => setCrop(true)}
			/>
		</SafeAreaView>
	);
};

export default EditImageView;
