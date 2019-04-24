import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';

import Avatar from '../../containers/Avatar';
import I18n from '../../i18n';
import styles, { ROW_HEIGHT } from './styles';
import UnreadBadge from './UnreadBadge';
import TypeIcon from './TypeIcon';
import LastMessage from './LastMessage';

export { ROW_HEIGHT };

const attrs = ['name', 'unread', 'userMentions', 'showLastMessage', 'alert', 'type'];
@connect(state => ({
	userId: state.login.user && state.login.user.id,
	username: state.login.user && state.login.user.username,
	token: state.login.user && state.login.user.token
}))
export default class RoomItem extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		showLastMessage: PropTypes.bool,
		_updatedAt: PropTypes.string,
		lastMessage: PropTypes.object,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		id: PropTypes.string,
		prid: PropTypes.string,
		onPress: PropTypes.func,
		userId: PropTypes.string,
		username: PropTypes.string,
		token: PropTypes.string,
		avatarSize: PropTypes.number,
		testID: PropTypes.string,
		height: PropTypes.number
	}

	static defaultProps = {
		avatarSize: 48
	}

	shouldComponentUpdate(nextProps) {
		const { lastMessage, _updatedAt } = this.props;
		const oldlastMessage = lastMessage;
		const newLastmessage = nextProps.lastMessage;

		if (oldlastMessage && newLastmessage && oldlastMessage.ts !== newLastmessage.ts) {
			return true;
		}
		if (_updatedAt && nextProps._updatedAt && nextProps._updatedAt !== _updatedAt) {
			return true;
		}
		// eslint-disable-next-line react/destructuring-assignment
		return attrs.some(key => nextProps[key] !== this.props[key]);
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	render() {
		const {
			unread, userMentions, name, _updatedAt, alert, testID, height, type, avatarSize, baseUrl, userId, username, token, onPress, id, prid, showLastMessage, lastMessage
		} = this.props;

		const date = this.formatDate(_updatedAt);

		let accessibilityLabel = name;
		if (unread === 1) {
			accessibilityLabel += `, ${ unread } ${ I18n.t('alert') }`;
		} else if (unread > 1) {
			accessibilityLabel += `, ${ unread } ${ I18n.t('alerts') }`;
		}

		if (userMentions > 0) {
			accessibilityLabel += `, ${ I18n.t('you_were_mentioned') }`;
		}

		if (date) {
			accessibilityLabel += `, ${ I18n.t('last_message') } ${ date }`;
		}

		return (
			<RectButton
				onPress={onPress}
				activeOpacity={0.8}
				underlayColor='#e1e5e8'
				testID={testID}
			>
				<View
					style={[styles.container, height && { height }]}
					accessibilityLabel={accessibilityLabel}
				>
					<Avatar text={name} size={avatarSize} type={type} baseUrl={baseUrl} style={styles.avatar} userId={userId} token={token} />
					<View style={styles.centerContainer}>
						<View style={styles.titleContainer}>
							<TypeIcon type={type} id={id} prid={prid} />
							<Text style={[styles.title, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
							{_updatedAt ? <Text style={[styles.date, alert && styles.updateAlert]} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
						</View>
						<View style={styles.row}>
							<LastMessage lastMessage={lastMessage} type={type} showLastMessage={showLastMessage} username={username} alert={alert} />
							<UnreadBadge unread={unread} userMentions={userMentions} type={type} />
						</View>
					</View>
				</View>
			</RectButton>
		);
	}
}
