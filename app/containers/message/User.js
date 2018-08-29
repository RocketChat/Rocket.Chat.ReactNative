import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';
import Avatar from '../Avatar';

const styles = StyleSheet.create({
	username: {
		color: '#0C0D0F',
		fontWeight: '600',
		fontSize: 16,
		lineHeight: 22
	},
	usernameView: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 2
	},
	alias: {
		fontSize: 14,
		color: '#9EA2A8',
		paddingLeft: 6,
		lineHeight: 16
	},
	time: {
		fontSize: 14,
		color: '#9EA2A8',
		paddingLeft: 10,
		fontWeight: '300',
		lineHeight: 16
	},
	edited: {
		marginLeft: 6,
		flexDirection: 'row',
		alignItems: 'center'
	}
});

export default class User extends React.PureComponent {
	static propTypes = {
		timeFormat: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		username: PropTypes.string,
		alias: PropTypes.string,
		ts: PropTypes.instanceOf(Date),
		editedBy: PropTypes.string,
		temp: PropTypes.bool,
		onPress: PropTypes.func
	}

	renderEdited = (editedBy) => {
		if (!editedBy) {
			return null;
		}
		return (
			<View style={styles.edited}>
				<Icon name='pencil-square-o' color='#888' size={12} />
				<Avatar
					style={{ marginLeft: 6 }}
					text={editedBy}
					size={20}
					baseUrl={this.props.baseUrl}
				/>
			</View>
		);
	}

	render() {
		const {
			username, alias, ts, editedBy, temp
		} = this.props;

		const extraStyle = {};
		if (temp) {
			extraStyle.opacity = 0.3;
		}

		const aliasUsername = alias ? (<Text style={styles.alias}>@{username}</Text>) : null;
		const time = moment(ts).format(this.props.timeFormat);

		return (
			<View style={styles.usernameView}>
				<Text onPress={this.props.onPress} style={styles.username}>
					{alias || username}
				</Text>
				{aliasUsername}
				<Text style={styles.time}>{time}</Text>
				{this.renderEdited(editedBy)}
			</View>
		);
	}
}
