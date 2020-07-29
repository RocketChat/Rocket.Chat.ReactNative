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
import { THUMBS_HEIGHT } from './constants';
import sharedStyles from '../Styles';
import { allowPreview } from './utils';
import I18n from '../../i18n';

const MESSAGEBOX_HEIGHT = 56;

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

const IconPreview = React.memo(({
	iconName, title, description, theme, width, height, danger
}) => (
	<ScrollView
		style={{ backgroundColor: themes[theme].auxiliaryBackground }}
		contentContainerStyle={[styles.fileContainer, { width, height }]}
	>
		<CustomIcon
			name={iconName}
			size={56}
			color={danger ? themes[theme].dangerColor : themes[theme].tintColor}
		/>
		<Text style={[styles.fileName, { color: themes[theme].titleText }]}>{title}</Text>
		{description ? <Text style={[styles.fileSize, { color: themes[theme].bodyText }]}>{description}</Text> : null}
	</ScrollView>
));

const Preview = React.memo(({
	item, theme, isShareExtension, length
}) => {
	const type = item?.mime;
	const { width, height } = useDimensions();
	const { isLandscape } = useOrientation();
	const insets = useSafeAreaInsets();
	const headerHeight = getHeaderHeight(isLandscape);
	const thumbsHeight = (length > 1) ? THUMBS_HEIGHT : 0;
	const calculatedHeight = height - insets.top - insets.bottom - MESSAGEBOX_HEIGHT - thumbsHeight - headerHeight;

	if (item?.canUpload) {
		if (type?.match(/video/)) {
			return (
				<ScrollView style={{ height: calculatedHeight }}>
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
				</ScrollView>
			);
		}

		// Disallow preview of images too big in order to prevent memory issues on iOS share extension
		if (allowPreview(isShareExtension, item?.size)) {
			if (type?.match(/image/)) {
				return (
					<ImageViewer
						uri={item.path}
						imageComponentType={isShareExtension ? types.REACT_NATIVE_IMAGE : types.FAST_IMAGE}
						width={width}
						height={calculatedHeight}
						theme={theme}
					/>
				);
			}
		}
		return (
			<IconPreview
				iconName={type?.match(/image/) ? 'image' : 'attach'}
				title={item?.filename}
				description={prettyBytes(item?.size ?? 0)}
				theme={theme}
				width={width}
				height={calculatedHeight}
			/>
		);
	}

	return (
		<IconPreview
			iconName='warning'
			title={I18n.t(item?.error)}
			description={prettyBytes(item?.size ?? 0)}
			theme={theme}
			width={width}
			height={calculatedHeight}
			danger
		/>
	);
});
Preview.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	isShareExtension: PropTypes.bool,
	length: PropTypes.number
};

IconPreview.propTypes = {
	iconName: PropTypes.string,
	title: PropTypes.string,
	description: PropTypes.string,
	theme: PropTypes.string,
	width: PropTypes.number,
	height: PropTypes.number,
	danger: PropTypes.bool
};

export default Preview;
