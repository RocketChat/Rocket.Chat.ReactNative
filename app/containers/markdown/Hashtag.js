import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-native';

import styles from './styles';

const Hashtag = React.memo(({
	hashtag, channels, onPress
}) => {
	const handlePress = () => {
		if (onPress) {
			onPress(hashtag);
		}
	};

	if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
		return (
			<Text
				style={styles.mention}
				onPress={handlePress}
			>
				{`#${ hashtag }`}
			</Text>
		);
	}
	return `#${ hashtag }`;
});

Hashtag.propTypes = {
	hashtag: PropTypes.string,
	onPress: PropTypes.func,
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default Hashtag;
