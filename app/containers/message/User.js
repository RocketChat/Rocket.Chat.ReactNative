import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';

const styles = StyleSheet.create({
	username: {
		fontWeight: 'bold'
	},
	usernameView: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 2
	},
	alias: {
		fontSize: 10,
		color: '#888',
		paddingLeft: 5
	},
	time: {
		fontSize: 10,
		color: '#888',
		paddingLeft: 5
	}
});

export default class Message extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		onPress: PropTypes.func
	}

	render() {
		const { item } = this.props;

		const extraStyle = {};
		if (item.temp) {
			extraStyle.opacity = 0.3;
		}

		const username = item.alias || item.u.username;
		const aliasUsername = item.alias ? (<Text style={styles.alias}>@{item.u.username}</Text>) : null;
		const time = moment(item.ts).format(this.props.Message_TimeFormat);

		return (
			<View style={styles.usernameView}>
				<Text onPress={this.props.onPress} style={styles.username}>
					{username}
				</Text>
				{aliasUsername}<Text style={styles.time}>{time}</Text>
			</View>
		);
	}
}
