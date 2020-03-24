import React from 'react';
import FastImage from 'react-native-fast-image';
import PropTypes from 'prop-types';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

const CustomEmoji = React.memo(({ baseUrl, emoji, style }) => (
	<FastImage
		style={style}
		source={{
			uri: `${ baseUrl }/emoji-custom/${ encodeURIComponent(emoji.content || emoji.name) }.${ emoji.extension }`,
			headers: RocketChatSettings.customHeaders,
			priority: FastImage.priority.high
		}}
		resizeMode={FastImage.resizeMode.contain}
	/>
), (prevProps, nextProps) => {
	const prevEmoji = prevProps.emoji.content || prevProps.emoji.name;
	const nextEmoji = nextProps.emoji.content || nextProps.emoji.name;
	return prevEmoji === nextEmoji;
});

CustomEmoji.propTypes = {
	baseUrl: PropTypes.string.isRequired,
	emoji: PropTypes.object.isRequired,
	style: PropTypes.any
};

export default CustomEmoji;
