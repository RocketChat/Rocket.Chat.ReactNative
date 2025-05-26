import React from 'react';
import { FlatList, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RouteProp } from '@react-navigation/native';

import SafeAreaView from '../../containers/SafeAreaView';
import { InsideStackParamList } from '../../stacks/types';
import EditOptionsBar from './components/EditOptionsBar';
import useEditableImage from './hooks/useEditableImage';
import getHorizontalPadding from './utils/getHorizontalPadding';
import useImageEditor from './hooks/useImageEditor';
import Grid from './components/Grid';
import Touch from '../../containers/Touch';
import { useActionSheet } from '../../containers/ActionSheet';
import { CustomIcon } from '../../containers/CustomIcon';

// To Do:
// - action sheet of resize;
// - Test horizontal device;
// - Add Pinch detector;
// - Organize code;

const styles = StyleSheet.create({
	container: {
		paddingBottom: 30
	},
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
		<SafeAreaView style={styles.container}>
			{showUndo ? (
				<Touch style={{ position: 'absolute', top: 70, left: 20 }} onPress={undoEdit}>
					<CustomIcon name='arrow-back' size={20} />
				</Touch>
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
				<View style={{ marginBottom: 20 }}>
					<FlatList
						horizontal
						data={images}
						centerContent
						contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center' }}
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
