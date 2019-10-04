import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import styles from './styles';

const AtMention = React.memo(({
	mention, mentions, username, navToRoomInfo, preview, style = []
}) => {
	let mentionStyle = styles.mention;
	if (mention === 'all' || mention === 'here') {
		mentionStyle = {
			...mentionStyle,
			...styles.mentionAll
		};
	} else if (mention === username) {
		mentionStyle = {
			...mentionStyle,
			...styles.mentionLoggedUser
		};
	}

	const handlePress = () => {
		if (mentions && mentions.length && mentions.findIndex(m => m.username === mention) !== -1) {
			const index = mentions.findIndex(m => m.username === mention);
			const navParam = {
				t: 'd',
				rid: mentions[index]._id
			};
			navToRoomInfo(navParam);
		}
	};

	return (
		<Text
			style={[preview ? styles.text : mentionStyle, ...style]}
			onPress={preview ? undefined : handlePress}
		>
			{`@${ mention }`}
		</Text>
	);
});

AtMention.propTypes = {
	mention: PropTypes.string,
	username: PropTypes.string,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.array,
	preview: PropTypes.bool,
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default AtMention;
