import React from 'react';
import isEqual from 'deep-equal';
import PropTypes from 'prop-types';

import Image from './Image';
import Audio from './Audio';
import Video from './Video';
import Reply from './Reply';

const Attachments = React.memo(({
	attachments, timeFormat, user, baseUrl, customEmojis
}) => {
	if (attachments.length === 0) {
		return null;
	}

	return attachments.map((file, index) => {
		if (file.image_url) {
			return <Image key={file.image_url} file={file} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
		}
		if (file.audio_url) {
			return <Audio key={file.audio_url} file={file} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
		}
		if (file.video_url) {
			return <Video key={file.video_url} file={file} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
		}

		// eslint-disable-next-line react/no-array-index-key
		return <Reply key={index} index={index} attachment={file} timeFormat={timeFormat} user={user} baseUrl={baseUrl} customEmojis={customEmojis} />;
	});
}, (prevProps, nextProps) => isEqual(prevProps.attachments, nextProps.attachments));

Attachments.propTypes = {
	attachments: PropTypes.array,
	timeFormat: PropTypes.string,
	user: PropTypes.object,
	baseUrl: PropTypes.string
};

export default Attachments;
