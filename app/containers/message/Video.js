import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { dequal } from 'dequal';

import { CustomIcon } from '../../lib/Icons';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import MessageContext from './Context';
import ImageContainer from './Image';

const styles = StyleSheet.create({
	play: {
		position: 'absolute',
		alignSelf: 'center'
	}
});

const Video = React.memo(({
	file, showAttachment, getCustomEmoji, theme
}) => {
	const { baseUrl, user } = useContext(MessageContext);
	let img;
	if (file.image_preview) {
		img = formatAttachmentUrl(file.image_preview, user.id, user.token, baseUrl);
	}
	if (!baseUrl) {
		return null;
	}

	return (
		<ImageContainer file={file} imageUrl={img} getCustomEmoji={getCustomEmoji} showAttachment={showAttachment} theme={theme}>
			<CustomIcon
				style={styles.play}
				name='play-filled'
				size={54}
				color={themes[theme].buttonText}
			/>
		</ImageContainer>
	);
}, (prevProps, nextProps) => dequal(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme);

Video.propTypes = {
	file: PropTypes.object,
	showAttachment: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};

export default Video;
