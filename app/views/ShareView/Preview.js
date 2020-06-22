import React from 'react';
import PropTypes from 'prop-types';
import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon } from '../../lib/Icons';
import { ImageViewer, types } from '../../presentation/ImageViewer';
import { themes } from '../../constants/colors';
import styles from './styles';
import { useDimensions, useOrientation } from '../../dimensions';
import { getHeaderHeight } from '../../containers/Header';
import { isIOS } from '../../utils/deviceInfo';

const Preview = React.memo(({
	item, theme, shareExtension, loading, length
}) => {
	const type = item?.mime;

	if (type?.match(/video/)) {
		return (
			<Video
				source={{ uri: item.path }}
				rate={1.0}
				volume={1.0}
				isMuted={false}
				resizeMode={Video.RESIZE_MODE_CONTAIN}
				shouldPlay
				isLooping={false}
				style={styles.video}
				useNativeControls
			/>
		);
	}

	if (type?.match(/image/)) {
		const { width, height } = useDimensions();
		const { isLandscape } = useOrientation();
		const insets = useSafeAreaInsets();
		const headerHeight = getHeaderHeight(isLandscape);
		const messageboxHeight = isIOS ? 56 : 0;
		const thumbsHeight = (length > 1) ? 86 : 0;
		return (
			<ImageViewer
				uri={item.path}
				imageComponentType={shareExtension ? types.REACT_NATIVE_IMAGE : types.FAST_IMAGE}
				width={width}
				height={height - insets.top - insets.bottom - messageboxHeight - thumbsHeight - headerHeight}
				loading={loading}
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
	shareExtension: PropTypes.bool
};

export default Preview;
