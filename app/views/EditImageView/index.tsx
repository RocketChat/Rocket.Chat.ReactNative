import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
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

// To Do:
// - action sheet of resize;
// - Add Pinch detector;
// - Test horizontal device;
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
	const { images, editableImage, originalImageSize, selectImageToEdit, updateImage, updateOriginaImageSize } = useEditableImage({
		attachments: route?.params?.attachments
	});
	const {
		cropSelectorEnabled,
		onCrop,
		rotateLeft,
		rotateRight,
		openCropEditor,
		cancelCropEditor,
		imageWidth,
		imageHeight,
		gridPosition: { prevTranslationXValue, prevTranslationYValue, top, left, gridHeight, gridWidth }
	} = useImageEditor({
		editableImage,
		originalImageSize,
		screenWidth,
		screenHeight,
		updateImage,
		updateOriginaImageSize
	});

	const onCancel = () => {
		navigation.goBack();
	};

	const imageAnimatedStyle = useAnimatedStyle(() => ({
		width: imageWidth.value,
		height: imageHeight.value
	}));

	const composedGesture = Gesture.Exclusive();

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.editContent}>
				<GestureDetector gesture={composedGesture}>
					<View style={{ paddingHorizontal: getHorizontalPadding(screenWidth, gridWidth.value) }}>
						<Animated.Image source={{ uri: editableImage }} style={imageAnimatedStyle} />

						{editableImage && cropSelectorEnabled ? (
							<Grid
								height={screenHeight}
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

			<EditOptionsBar
				crop={onCrop}
				isCropping={cropSelectorEnabled}
				onCancel={onCancel}
				onCancelCrop={cancelCropEditor}
				onContinue={async () => {}}
				openResizeOptions={() => {}}
				rotateLeft={rotateLeft}
				rotateRight={rotateRight}
				startCrop={openCropEditor}
			/>
		</SafeAreaView>
	);
};

export default EditImageView;
