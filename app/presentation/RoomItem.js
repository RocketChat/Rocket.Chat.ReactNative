import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, PixelRatio
} from 'react-native';
import { connect } from 'react-redux';
import { emojify } from 'react-emojione';
import { RectButton } from 'react-native-gesture-handler';

import Avatar from '../containers/Avatar';
import Status from '../containers/Status';
import RoomTypeIcon from '../containers/RoomTypeIcon';
import I18n from '../i18n';
import sharedStyles from '../views/Styles';
import { COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_WHITE } from '../constants/colors';

export const ROW_HEIGHT = 75 * PixelRatio.getFontScale();

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 14,
		height: ROW_HEIGHT
	},
	centerContainer: {
		flex: 1,
		paddingVertical: 10,
		paddingRight: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR
	},
	title: {
		flex: 1,
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textMedium
	},
	alert: {
		...sharedStyles.textSemibold
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	titleContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	date: {
		fontSize: 13,
		marginLeft: 4,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	updateAlert: {
		color: COLOR_PRIMARY,
		...sharedStyles.textSemibold
	},
	unreadNumberContainer: {
		minWidth: 23,
		padding: 3,
		borderRadius: 4,
		backgroundColor: COLOR_PRIMARY,
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 10
	},
	unreadNumberText: {
		color: COLOR_WHITE,
		overflow: 'hidden',
		fontSize: 13,
		...sharedStyles.textRegular,
		letterSpacing: 0.56
	},
	status: {
		marginRight: 7,
		marginTop: 3
	},
	markdownText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 17,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	markdownTextAlert: {
		...sharedStyles.textColorNormal
	},
	avatar: {
		marginRight: 10
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
		<View style={styles.unreadNumberContainer}>
			<Text style={styles.unreadNumberText}>{ unread }</Text>
		</View>
	);
};

const attrs = ['name', 'unread', 'userMentions', 'showLastMessage', 'alert', 'type'];
@connect(state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	}
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
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
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

	get avatar() {
		const {
			type, name, avatarSize, baseUrl, user
		} = this.props;
		return <Avatar text={name} size={avatarSize} type={type} baseUrl={baseUrl} style={styles.avatar} user={user} />;
	}

	get lastMessage() {
		const {
			lastMessage, type, showLastMessage, user
		} = this.props;

		if (!showLastMessage) {
			return '';
		}
		if (!lastMessage) {
			return I18n.t('No_Message');
		}

		let prefix = '';
		const me = lastMessage.u.username === user.username;

		if (!lastMessage.msg && Object.keys(lastMessage.attachments).length > 0) {
			if (me) {
				return I18n.t('User_sent_an_attachment', { user: I18n.t('You') });
			} else {
				return I18n.t('User_sent_an_attachment', { user: lastMessage.u.username });
			}
		}

		if (me) {
			prefix = I18n.t('You_colon');
		}	else if (type !== 'd') {
			prefix = `${ lastMessage.u.username }: `;
		}

		let msg = `${ prefix }${ lastMessage.msg.replace(/[\n\t\r]/igm, '') }`;
		msg = emojify(msg, { output: 'unicode' });
		return msg;
	}

	get type() {
		const { type, id, prid } = this.props;
		if (type === 'd') {
			return <Status style={styles.status} size={10} id={id} />;
		}
		return <RoomTypeIcon type={prid ? 'discussion' : type} />;
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	render() {
		const {
			unread, userMentions, name, _updatedAt, alert, testID, height, onPress
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
					{this.avatar}
					<View style={styles.centerContainer}>
						<View style={styles.titleContainer}>
							{this.type}
							<Text style={[styles.title, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
							{_updatedAt ? <Text style={[styles.date, alert && styles.updateAlert]} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
						</View>
						<View style={styles.row}>
							<Text style={[styles.markdownText, alert && styles.markdownTextAlert]} numberOfLines={2}>
								{this.lastMessage}
							</Text>
							{renderNumber(unread, userMentions)}
						</View>
					</View>
				</View>
			</RectButton>
		);
	}
}
