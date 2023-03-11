import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const ImageSkeletonPlaceholder = ({ style, ...otherProps }: FastImageProps): React.ReactElement => {
	const [isLoading, setLoading] = useState(true);

	const handleLoadEnd = () => {
		setLoading(false);
	};

	// We inject relevant properties of the `style` passed to the FastImage
	// so as to avoid a "jump" when the image finishes loading:
	const flattenedStyle = StyleSheet.flatten(style);

	const skeletonPlaceholder = (
		<View testID='skeleton-placeholder'>
			<SkeletonPlaceholder>
				<SkeletonPlaceholder.Item
					height={flattenedStyle?.height ?? '100%'}
					minHeight={flattenedStyle?.minHeight ?? '100%'}
					width={flattenedStyle?.width ?? '100%'}
					borderRadius={flattenedStyle?.borderRadius}
				/>
			</SkeletonPlaceholder>
		</View>
	);

	return (
		<View testID='image-skeleton-placeholder'>
			{isLoading && skeletonPlaceholder}
			{/* Hide <FastImage /> while it is loading: */}
			<FastImage
				style={[{ display: isLoading ? 'none' : 'flex' }, style]}
				onLoadEnd={handleLoadEnd}
				{...otherProps}
			/>
		</View>
	);
};

export default ImageSkeletonPlaceholder;
