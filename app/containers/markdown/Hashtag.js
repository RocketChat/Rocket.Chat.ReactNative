import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';

const Hashtag = React.memo(({
	hashtag, channels, navToRoomPreview, style = [], theme
}) => {
	const handlePress = () => {
		const index = channels.findIndex(channel => channel.name === hashtag);
		const { _id, name } = channels[index];
		navToRoomPreview({ rid: _id, name });
	};

	if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
		return (
			<Text
				style={[styles.mention, ...style]}
				onPress={handlePress}
			>
				{hashtag}
			</Text>
		);
	}
	return (
		<Text style={[styles.text, { color: themes[theme].bodyText }, ...style]}>
			{`#${ hashtag }`}
		</Text>
	);
});

Hashtag.propTypes = {
	hashtag: PropTypes.string,
	navToRoomPreview: PropTypes.func,
	style: PropTypes.array,
	theme: PropTypes.string,
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Hashtag;
