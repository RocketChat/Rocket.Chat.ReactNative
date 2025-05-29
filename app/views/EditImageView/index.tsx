import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActionSheet } from '../../containers/ActionSheet';
import { InsideStackParamList } from '../../stacks/types';
import SafeAreaView from '../../containers/SafeAreaView';
import EditOptionsBar from './components/EditOptionsBar';
import useEditableImage from './hooks/useEditableImage';
import getHorizontalPadding from './methods/getHorizontalPadding';
import useImageEditor from './hooks/useImageEditor';
import Grid from './components/Grid';
import ImageSelector from './components/ImageSelector';
import UndoEdit from './components/UndoEdit';

// To Do:
// Loading;
// remove word and add icons;
// - Organize code;
// - Clean the file on cancel and send;
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
	const insets = useSafeAreaInsets();
	const isPortrait = screenHeight > screenWidth;
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
		loading,
		cropSelectorEnabled,
		onSelectAspectRatioOption,
		onCrop,
		rotateLeft,
		rotateRight,
		openCropEditor,
		cancelCropEditor,
		imageWidth,
		imageHeight,
		availableAspectRatioOptions,
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

	const openAspectRatioOptions = () => {
		showActionSheet({
			options: availableAspectRatioOptions.map(item => ({
				title: item,
				onPress: () => onSelectAspectRatioOption(item)
			}))
		});
	};

	const onContinue = () => {
		navigation.replace('ShareView', { ...route.params, attachments: images });
	};

	const imageAnimatedStyle = useAnimatedStyle(() => ({
		width: imageWidth.value,
		height: imageHeight.value
	}));

	return (
		<SafeAreaView style={{ paddingTop: insets.top }}>
			{showUndo ? <UndoEdit isPortrait={isPortrait} onUndoPress={undoEdit} /> : null}

			<View style={styles.editContent}>
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
							imageSizeHeight={imageHeight}
						/>
					) : null}
				</View>
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
				loading={loading}
				crop={onCrop}
				isCropping={cropSelectorEnabled}
				onCancel={onCancel}
				onCancelCrop={cancelCropEditor}
				onContinue={onContinue}
				openAspectRatioOptions={openAspectRatioOptions}
				rotateLeft={rotateLeft}
				rotateRight={rotateRight}
				startCrop={openCropEditor}
			/>
		</SafeAreaView>
	);
};

export default EditImageView;
