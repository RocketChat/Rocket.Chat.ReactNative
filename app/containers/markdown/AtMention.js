import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import styles from './styles';

export default class AtMention extends React.PureComponent {
	static propTypes = {
		mention: PropTypes.string,
		username: PropTypes.string,
		onPress: PropTypes.func
	};

	render() {
		const { mention, onPress, username } = this.props;

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
				{`@${ mention }`}
			</Text>
		);
	}
}
