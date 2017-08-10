import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { CachedImage } from 'react-native-img-cache';
import Markdown from 'react-native-easy-markdown';
import { emojify } from 'react-emojione';

const styles = StyleSheet.create({
	message: {
		borderColor: '#aaa',
		padding: 14,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
	avatarContainer: {
		backgroundColor: '#ccc',
		width: 40,
		height: 40,
		marginRight: 10,
		borderRadius: 5
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 5
	},
	texts: {
		flex: 1
	},
	msg: {
		flex: 1
	},
	username: {
		fontWeight: 'bold',
		marginBottom: 5
	}
});

export default class Message extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		baseUrl: PropTypes.string.isRequired
	}

	render() {
		const extraStyle = {};
		if (this.props.item.temp) {
			extraStyle.opacity = 0.3;
		}

		const msg = emojify(this.props.item.msg || 'asd', { output: 'unicode' });

		return (
			<View style={[styles.message, extraStyle]}>
				<View style={styles.avatarContainer}>
					<CachedImage style={styles.avatar} source={{ uri: `${ this.props.baseUrl }/avatar/${ this.props.item.u.username }` }} />
				</View>
				<View style={styles.texts}>
					<Text onPress={this._onPress} style={styles.username}>
						{this.props.item.u.username}
					</Text>
					<Markdown>
						{msg}
					</Markdown>
				</View>
			</View>
		);
	}
}
