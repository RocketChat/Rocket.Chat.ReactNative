import React from 'react';
import PropTypes from 'prop-types';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon } from '../../lib/Icons';
import { ImageViewer, types } from '../../presentation/ImageViewer';
import { themes } from '../../constants/colors';
import { useDimensions, useOrientation } from '../../dimensions';
import { getHeaderHeight } from '../../containers/Header';
import { isIOS } from '../../utils/deviceInfo';
import { THUMBS_HEIGHT } from './constants';

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

	return (
		<CustomIcon
			name='clip'
			size={56}
			color={themes[theme].auxiliaryBackground}
		/>
	);
});
Preview.propTypes = {
	item: PropTypes.object,
	theme: PropTypes.string,
	shareExtension: PropTypes.bool,
	length: PropTypes.number
};

export default Preview;
