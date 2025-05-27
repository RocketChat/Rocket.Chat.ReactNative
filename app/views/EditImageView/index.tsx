import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
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
import ImageSelector from './components/ImageSelector';

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
	}
});

interface IEditImageViewProps {
	navigation: NativeStackNavigationProp<InsideStackParamList, 'EditImageView'>;
	route: RouteProp<InsideStackParamList, 'EditImageView'>;
}

const EditImageView = ({ navigation, route }: IEditImageViewProps) => {
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
				<ImageSelector
					selectImageToEdit={selectImageToEdit}
					editableImage={editableImage}
					images={images}
					isPortrait={isPortrait}
					screenHeight={screenHeight}
				/>
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
