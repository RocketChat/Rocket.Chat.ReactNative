import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, Image } from 'react-native';

const styles = StyleSheet.create({
	message: {
		borderColor: '#aaa',
		padding: 14,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
	avatar: {
		backgroundColor: '#ccc',
		width: 40,
		height: 40,
		marginRight: 10,
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

		return (
			<View style={[styles.message, extraStyle]}>
				<Image style={styles.avatar} source={{ uri: `${ this.props.baseUrl }/avatar/${ this.props.item.u.username }` }} />
				<View style={styles.texts}>
					<Text onPress={this._onPress} style={styles.username}>
						{this.props.item.u.username}
					</Text>
					<Text style={styles.msg}>
						{this.props.item.msg}
					</Text>
					{/* <Markdown whitelist={['link', 'url']}>
						{this.props.item.msg}
					</Markdown> */}
				</View>
			</View>
		);
	}
}
