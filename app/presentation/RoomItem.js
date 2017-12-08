import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Avatar from '../containers/Avatar';

const styles = StyleSheet.create({
	container: {
		// flex: 1,
		flexDirection: 'row',
		paddingLeft: 16,
		paddingRight: 16,
		height: 56,
		alignItems: 'center'
	},
	number: {
		minWidth: 20,
		borderRadius: 3,
		backgroundColor: '#1d74f5',
		color: '#fff',
		textAlign: 'center',
		overflow: 'hidden',
		fontSize: 14,
		paddingHorizontal: 5,
		paddingVertical: 2
	},
	roomNameView: {
		flex: 1,
		marginLeft: 16,
		marginRight: 4
	},
	roomName: {
		paddingTop: 10,
		flex: 1,
		fontSize: 16,
		height: 16,
		color: '#444'
	},
	alert: {
		fontWeight: 'bold'
	},
	favorite: {
		// backgroundColor: '#eee'
	},
	update: {
		flex: 1,
		fontSize: 10,
		height: 10,
		color: '#888'
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		_updatedAt: PropTypes.instanceOf(Date),
		favorite: PropTypes.bool,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		baseUrl: PropTypes.string,
		onPress: PropTypes.func
	}

	get icon() {
		const { type, name, baseUrl } = this.props;
		return <Avatar text={name} baseUrl={baseUrl} size={40} type={type} />;
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: 'dddd',
		sameDay: 'HH:mm',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	renderNumber = (unread, userMentions) => {
		if (!unread || unread <= 0) {
			return;
		}

		if (unread >= 1000) {
			unread = '999+';
		}

		if (userMentions > 0) {
			unread = `@ ${ unread }`;
		}

		return (
			<Text style={styles.number}>
				{ unread }
			</Text>
		);
	}

	render() {
		const {
			favorite, alert, unread, userMentions, name, _updatedAt
		} = this.props;

		return (
			<TouchableOpacity onPress={this.props.onPress} style={[styles.container, favorite && styles.favorite]}>
				{this.icon}
				<View style={styles.roomNameView}>
					<Text style={[styles.roomName, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
					{_updatedAt ? <Text style={styles.update} ellipsizeMode='tail' numberOfLines={1}>{ this.formatDate(_updatedAt) }</Text> : null}
				</View>
				{this.renderNumber(unread, userMentions)}
			</TouchableOpacity>
		);
	}
}
