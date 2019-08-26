import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import styles from './styles';

const AtMention = React.memo(({
	mention, onPress, username
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

	return (
		<Text
			style={mentionStyle}
			onPress={onPress}
		>
			{` @${ mention } `}
		</Text>
	);
});

AtMention.propTypes = {
	mention: PropTypes.string,
	username: PropTypes.string,
	onPress: PropTypes.func
};

export default AtMention;
