import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';
import Avatar from '../Avatar';

const styles = StyleSheet.create({
	username: {
		color: '#000',
		fontWeight: '400',
		fontSize: 14
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
		paddingLeft: 5,
		fontWeight: '400'
	},
	edited: {
		marginLeft: 5,
		flexDirection: 'row',
		alignItems: 'center'
	}
});

export default class User extends React.PureComponent {
	static propTypes = {
		item: PropTypes.object.isRequired,
		Message_TimeFormat: PropTypes.string.isRequired,
		onPress: PropTypes.func
	}

	renderEdited = (item) => {
		if (!item.editedBy) {
			return null;
		}
		return (
			<View style={styles.edited}>
				<Icon name='pencil-square-o' color='#888' size={10} />
				<Avatar
					style={{ marginLeft: 5 }}
					text={item.editedBy.username}
					size={20}
					avatar={item.avatar}
				/>
			</View>
		);
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
				{aliasUsername}
				<Text style={styles.time}>{time}</Text>
				{this.renderEdited(item)}
			</View>
		);
	}
}
