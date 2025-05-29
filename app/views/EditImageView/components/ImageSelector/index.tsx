import React, { useEffect, useRef } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, View } from 'react-native';

import Touch from '../../../../containers/Touch';

const styles = StyleSheet.create({
	multipleImageListPortrait: {
		marginBottom: 20
	},
	multipleImageListLandscape: {
		position: 'absolute',
		flex: 1,
		top: 16,
		left: 16
	},
	listContent: {
		paddingHorizontal: 12,
		gap: 8,
		alignItems: 'center'
	}
});

interface IImageSelectorProps {
	screenHeight: number;
	isPortrait: boolean;
	images: any[];
	editableImage: any;
	selectImageToEdit: (item: any) => void;
}

const ImageSelector = ({ isPortrait, images, editableImage, selectImageToEdit, screenHeight }: IImageSelectorProps) => {
	const flatlistRef = useRef<FlatList>(null);

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
		<View
			style={
				isPortrait ? styles.multipleImageListPortrait : { ...styles.multipleImageListLandscape, maxHeight: screenHeight - 60 }
			}>
			<FlatList
				ref={flatlistRef}
				scrollEnabled={true}
				pointerEvents='auto'
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				horizontal={!!isPortrait}
				data={images}
				centerContent
				contentContainerStyle={styles.listContent}
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
	);
};
export default ImageSelector;
