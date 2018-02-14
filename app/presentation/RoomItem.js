import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import { emojify } from 'react-emojione';
import { connect } from 'react-redux';

import Avatar from '../containers/Avatar';
import Touch from '../utils/touch/index'; //eslint-disable-line

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: 'flex-start',
		borderBottomWidth: 0.5,
		borderBottomColor: '#ddd'
	},
	number: {
		minWidth: 25,
		borderRadius: 4,
		backgroundColor: '#1d74f5',
		color: '#fff',
		overflow: 'hidden',
		fontSize: 14,
		paddingVertical: 4,
		paddingHorizontal: 5,

		textAlign: 'center',
		alignItems: 'center',
		justifyContent: 'center'
	},
	roomNameView: {
		flex: 1,
		height: '100%',
		marginLeft: 16,
		marginRight: 4
	},
	roomName: {
		flex: 1,
		fontSize: 18,
		color: '#444',
		fontWeight: 'bold',
		marginRight: 8
	},
	lastMessage: {
		flex: 1,
		flexShrink: 1,
		fontSize: 16,
		color: '#444',
		marginRight: 8
		// margin: 0
	},
	alert: {
		fontWeight: 'bold'
	},
	favorite: {
		// backgroundColor: '#eee'
	},
	row: {
		width: '100%',
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	update: {
		fontSize: 10,
		color: '#888',
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const renderNumber = (unread, userMentions) => {
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
};

@connect(state => ({
	StoreLastMessage: state.settings.Store_Last_Message
}))
export default class RoomItem extends React.PureComponent {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		StoreLastMessage: PropTypes.bool,
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
		return <Avatar text={name} baseUrl={baseUrl} size={56} type={type} />;
	}

	get lastMessage() {
		const {
			lastMessage
		} = this.props;

		if (!this.props.StoreLastMessage) {
			return '';
		}

		return lastMessage ? `${ lastMessage.u.username }: ${ emojify(lastMessage.msg, { output: 'unicode' }) }` : 'No Message';
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: '[Yesterday]',
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	render() {
		const {
			favorite, alert, unread, userMentions, name, _updatedAt
		} = this.props;

		const date = this.formatDate(_updatedAt);

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
						<View style={styles.row}>
							<Text style={styles.roomName} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
							{_updatedAt ? <Text style={styles.update} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
						</View>
						<View style={styles.row}>
							<Text style={[styles.lastMessage, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{this.lastMessage}</Text>
							{renderNumber(unread, userMentions)}
						</View>
					</View>
				</View>
			</Touch>
		);
	}
}
