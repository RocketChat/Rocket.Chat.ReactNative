import PropTypes from 'prop-types';
import React from 'react';
import { Text } from 'react-native';

import styles from './styles';

export default class Hashtag extends React.PureComponent {
	static propTypes = {
		hashtag: PropTypes.string,
		onPress: PropTypes.func,
		channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
	};

	handlePress = () => {
		const {
			onPress,
			hashtag
		} = this.props;

		if (onPress) {
			onPress(hashtag);
		}
	};

	render() {
		const { hashtag, channels } = this.props;

		if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
			return (
				<Text
					style={styles.mention}
					onPress={this.handlePress}
				>
					{`#${ hashtag }`}
				</Text>
			);
		}
		return `#${ hashtag }`;
	}
}
