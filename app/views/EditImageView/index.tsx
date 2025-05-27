import React, { useEffect, useRef } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActionSheet } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';
import { InsideStackParamList } from '../../stacks/types';
import SafeAreaView from '../../containers/SafeAreaView';
import EditOptionsBar from './components/EditOptionsBar';
import useEditableImage from './hooks/useEditableImage';
import getHorizontalPadding from './utils/getHorizontalPadding';
import useImageEditor from './hooks/useImageEditor';
import Grid from './components/Grid';
import Touch from '../../containers/Touch';

// To Do:
// - Add Pinch detector;
// - Organize code;
// - Clean the file;
// - Test edge cases of minimize app and voip;

const styles = StyleSheet.create({
	editContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	multipleImageListLandscape: {
		position: 'absolute',
		flex: 1,
		top: 16,
		left: 16
	}
});

interface IEditImageViewProps {
	navigation: NativeStackNavigationProp<InsideStackParamList, 'EditImageView'>;
	route: RouteProp<InsideStackParamList, 'EditImageView'>;
}

const EditImageView = ({ navigation, route }: IEditImageViewProps) => {
	const flatlistRef = useRef<FlatList>(null);
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const isPortrait = screenHeight > screenWidth;
	const insets = useSafeAreaInsets();
	const { showActionSheet } = useActionSheet();
	const {
		images,
		editableImage,
		originalImageSize,
		selectImageToEdit,
		updateImage,
		editableImageIsPortrait,
		updateEditableImage
	} = useEditableImage({
		attachments: route?.params?.attachments
	});
	const {
		cropSelectorEnabled,
		onSelectCropOption,
		onCrop,
		rotateLeft,
		rotateRight,
		openCropEditor,
		cancelCropEditor,
		imageWidth,
		imageHeight,
		availableCropOptions,
		showUndo,
		undoEdit,
		gridPosition: { prevTranslationXValue, prevTranslationYValue, top, left, gridHeight, gridWidth }
	} = useImageEditor({
		isPortrait,
		editableImageIsPortrait,
		editableImage,
		originalImageSize,
		screenWidth,
		screenHeight,
		updateImage,
		attachments: route?.params?.attachments,
		updateEditableImage
	});

	const onCancel = () => {
		navigation.goBack();
	};

	const openCropOptions = () => {
		showActionSheet({
			options: availableCropOptions.map(item => ({
				title: item,
				onPress: () => onSelectCropOption(item)
			}))
		});
	};

	const imageAnimatedStyle = useAnimatedStyle(() => ({
		width: imageWidth.value,
		height: imageHeight.value
	}));

	const composedGesture = Gesture.Exclusive();

	const onOrientationChange = () => {
		const currentListIndex = images.findIndex(item => item.filename === editableImage.filename);
		const screenRotateAnimationMs = 500;
		setTimeout(() => {
			flatlistRef.current?.scrollToIndex({ animated: true, index: currentListIndex, viewOffset: 0 });
		}, screenRotateAnimationMs);
	};

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', onOrientationChange);
		return () => {
			subscription.remove();
		};
	}, []);

	return (
		<SafeAreaView style={{ paddingBottom: insets.bottom, paddingTop: insets.top }}>
			{showUndo ? (
				<View style={{ paddingHorizontal: 16, alignItems: isPortrait ? 'flex-start' : 'flex-end' }}>
					<Touch onPress={undoEdit}>
						<CustomIcon name='arrow-back' size={24} />
					</Touch>
				</View>
			) : null}

			<View style={styles.editContent}>
				<GestureDetector gesture={composedGesture}>
					<View style={{ paddingHorizontal: getHorizontalPadding(screenWidth, gridWidth.value) }}>
						<Animated.Image source={{ uri: editableImage.path }} style={imageAnimatedStyle} />

						{editableImage && cropSelectorEnabled ? (
							<Grid
								height={imageHeight.value}
								imageSizeWidth={imageWidth}
								left={left}
								prevTranslationX={prevTranslationXValue}
								prevTranslationY={prevTranslationYValue}
								sharedValueHeight={gridHeight}
								sharedValueWidth={gridWidth}
								top={top}
								width={screenWidth}
							/>
						) : null}
					</View>
				</GestureDetector>
			</View>

			{images.length > 1 ? (
				<View style={isPortrait ? { marginBottom: 20 } : { ...styles.multipleImageListLandscape, maxHeight: screenHeight - 60 }}>
					<FlatList
						ref={flatlistRef}
						scrollEnabled={true}
						pointerEvents='auto'
						showsHorizontalScrollIndicator={false}
						showsVerticalScrollIndicator={false}
						horizontal={!!isPortrait}
						data={images}
						centerContent
						contentContainerStyle={{
							paddingHorizontal: 12,
							gap: 8,
							alignItems: 'center'
						}}
						renderItem={({ item }) => (
							<Touch onPress={() => selectImageToEdit(item)} style={{ borderRadius: 4 }}>
								<Image
									resizeMode='cover'
									source={{ uri: item.path }}
									style={{
										width: editableImage.filename === item.filename ? 60 : 45,
										height: editableImage.filename === item.filename ? 80 : 70,
										borderRadius: 4
									}}
								/>
							</Touch>
						)}
						keyExtractor={item => item.filename}
					/>
				</View>
			) : null}

			<EditOptionsBar
				crop={onCrop}
				isCropping={cropSelectorEnabled}
				onCancel={onCancel}
				onCancelCrop={cancelCropEditor}
				onContinue={async () => {}}
				openResizeOptions={openCropOptions}
				rotateLeft={rotateLeft}
				rotateRight={rotateRight}
				startCrop={openCropEditor}
			/>
		</SafeAreaView>
	);
};

export default EditImageView;
