import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import { CustomIcon } from '../CustomIcon';
import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	loadErrorView: {
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 10,
		marginBottom: 10,
		padding: 10,
		display: 'flex',
		flexDirection: 'row'
	},
	loadErrorText: {
		fontStyle: 'italic',
		marginLeft: 4
	}
});

const ImageWithSkeleton = ({ style, ...otherProps }: FastImageProps): React.ReactElement => {
	const [isLoading, setLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);

	const handleLoadEnd = () => {
		setLoading(false);
	};

	const handleLoadFailed = () => {
		setLoading(false);
		setLoadFailed(true);
	};

	// We inject relevant properties of the `style` passed to the FastImage
	// so as to avoid a "jump" when the image finishes loading:
	const flattenedStyle = StyleSheet.flatten(style); // may be undefined

	const passedHeight = flattenedStyle?.height;
	const passedMinHeight = flattenedStyle?.minHeight;

	let placeholderItemHeight: string | number | undefined;
	let placeholderItemMinHeight: string | number | undefined;

	if (passedHeight) {
		placeholderItemHeight = passedHeight;
	} else if (passedMinHeight) {
		placeholderItemMinHeight = passedMinHeight;
	} else {
		placeholderItemHeight = '100%'; // by default
	}

	const skeletonPlaceholder = (
		<View testID='image-with-skeleton-skeleton'>
			<SkeletonPlaceholder>
				<SkeletonPlaceholder.Item
					height={placeholderItemHeight}
					width={flattenedStyle?.width ?? '100%'}
					minHeight={placeholderItemMinHeight}
					borderRadius={flattenedStyle?.borderRadius}
				/>
			</SkeletonPlaceholder>
		</View>
	);

	const { theme } = useTheme();

	const loadErrorView = (
		<View
			style={{
				...styles.loadErrorView,
				backgroundColor: themes[theme].auxiliaryBackground,
				height: placeholderItemHeight,
				minHeight: placeholderItemMinHeight
			}}
		>
			<CustomIcon name='warning' color={themes[theme].dangerColor} size={16} />
			<Text style={{ ...styles.loadErrorText, color: themes[theme].infoText }}>{I18n.t('Failed_Load_Image')}</Text>
		</View>
	);

	return (
		<View testID='image-with-skeleton'>
			{isLoading && skeletonPlaceholder}
			{loadFailed && loadErrorView}
			<FastImage
				style={[{ display: isLoading || loadFailed ? 'none' : 'flex' }, style]}
				onLoadEnd={handleLoadEnd}
				onError={handleLoadFailed}
				{...otherProps}
			/>
		</View>
	);
};

export default ImageWithSkeleton;
