import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import Avatar from '../containers/Avatar';
import Touch from '../utils/touch/index'; //eslint-disable-line

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 10,
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
		flex: 1,
		fontSize: 16,
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
		// height: 10,
		color: '#888'
	}
});

export default class RoomItem extends React.PureComponent {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		_updatedAt: PropTypes.instanceOf(Date),
		lastMessage: PropTypes.object,
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
		lastDay: '[Yesterday]',
		sameDay: 'h:mm A',
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
			favorite, alert, unread, userMentions, name, lastMessage, _updatedAt
		} = this.props;

		const date = this.formatDate(_updatedAt);

		console.log("do we have a last message?", lastMessage);

		let accessibilityLabel = name;
		if (unread === 1) {
			accessibilityLabel += `, ${ unread } alert`;
		} else if (unread > 1) {
			accessibilityLabel += `, ${ unread } alerts`;
		}

		if (userMentions > 0) {
			accessibilityLabel += ', you were mentioned';
		}

		accessibilityLabel += `, last message ${ date }`;

		return (
			<Touch onPress={this.props.onPress} underlayColor='#FFFFFF' activeOpacity={0.5} accessibilityLabel={accessibilityLabel} accessibilityTraits='selected'>
				<View style={[styles.container, favorite && styles.favorite]}>
					{this.icon}
					<View style={styles.roomNameView}>
						<Text style={[styles.roomName, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
						{lastMessage ? <Text>{lastMessage.u.username}: {lastMessage.msg}</Text> : <Text>No Message</Text>}
						{_updatedAt ? <Text style={styles.update} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
					</View>
					{this.renderNumber(unread, userMentions)}
				</View>
			</Touch>
		);
	}
}
