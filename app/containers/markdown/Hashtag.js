import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';

const Hashtag = React.memo(({
	hashtag, channels, navToRoomInfo, style = [], theme
}) => {
	const handlePress = () => {
		const index = channels.findIndex(channel => channel.name === hashtag);
		const navParam = {
			t: 'c',
			rid: channels[index]._id
		};
		navToRoomInfo(navParam);
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
	navToRoomInfo: PropTypes.func,
	style: PropTypes.array,
	theme: PropTypes.string,
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Hashtag;
