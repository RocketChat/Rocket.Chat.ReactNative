import React from 'react';
import PropTypes from 'prop-types';
import { Video } from 'expo-av';

import { CustomIcon } from '../../lib/Icons';
import { ImageViewer, types } from '../../presentation/ImageViewer';
import { themes } from '../../constants/colors';
import styles from './styles';

const Preview = React.memo(({ item, theme, shareExtension }) => {
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
		return (
			<ImageViewer
				uri={item.path}
				imageComponentType={shareExtension ? types.REACT_NATIVE_IMAGE : types.FAST_IMAGE}
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
