import React from 'react';
import PropTypes from 'prop-types';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, Text, StyleSheet } from 'react-native';
import prettyBytes from 'pretty-bytes';

import { CustomIcon } from '../../lib/Icons';
import { ImageViewer, types } from '../../presentation/ImageViewer';
import { themes } from '../../constants/colors';
import { useDimensions, useOrientation } from '../../dimensions';
import { getHeaderHeight } from '../../containers/Header';
import { isIOS } from '../../utils/deviceInfo';
import { THUMBS_HEIGHT } from './constants';
import sharedStyles from '../Styles';
import { allowPreview } from './utils';

const styles = StyleSheet.create({
	fileContainer: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	fileName: {
		fontSize: 16,
		textAlign: 'center',
		marginHorizontal: 10,
		...sharedStyles.textMedium
	},
	fileSize: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

const Preview = React.memo(({
	item, theme, shareExtension, length
}) => {
	const type = item?.mime;
	const { width, height } = useDimensions();
	const { isLandscape } = useOrientation();
	const insets = useSafeAreaInsets();
	const headerHeight = getHeaderHeight(isLandscape);
	const messageboxHeight = isIOS ? 56 : 0;
	const thumbsHeight = (length > 1) ? THUMBS_HEIGHT : 0;
	const calculatedHeight = height - insets.top - insets.bottom - messageboxHeight - thumbsHeight - headerHeight;

	if (type?.match(/video/)) {
		return (
			<Video
				source={{ uri: item.path }}
				rate={1.0}
				volume={1.0}
				isMuted={false}
				resizeMode={Video.RESIZE_MODE_CONTAIN}
				isLooping={false}
				style={{ width, height: calculatedHeight }}
				useNativeControls
			/>
		);
	}

	// Disallow preview of images too big in order to prevent memory issues on iOS share extension
	if (allowPreview(shareExtension, item?.size)) {
		if (type?.match(/image/)) {
			return (
				<ImageViewer
					uri={item.path}
					imageComponentType={shareExtension ? types.REACT_NATIVE_IMAGE : types.FAST_IMAGE}
					width={width}
					height={calculatedHeight}
					theme={theme}
				/>
			);
		}
	}

	return (
		<ScrollView style={{ backgroundColor: themes[theme].auxiliaryBackground }} contentContainerStyle={[styles.fileContainer, { width, height: calculatedHeight }]}>
			<CustomIcon
				name={type?.match(/image/) ? 'Camera' : 'clip'}
				size={56}
				color={themes[theme].tintColor}
			/>
			<Text style={[styles.fileName, { color: themes[theme].titleText }]}>{item?.filename}</Text>
			<Text style={[styles.fileSize, { color: themes[theme].bodyText }]}>{prettyBytes(item?.size ?? 0)}</Text>
		</ScrollView>
	);
});
Preview.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	shareExtension: PropTypes.bool,
	length: PropTypes.number
};

export default Preview;
