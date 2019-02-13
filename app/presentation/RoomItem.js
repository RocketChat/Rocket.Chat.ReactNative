import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, Image
} from 'react-native';
import { connect } from 'react-redux';
import { emojify } from 'react-emojione';
import { RectButton } from 'react-native-gesture-handler';

import Avatar from '../containers/Avatar';
import Status from '../containers/status';
import Touch from '../utils/touch/index'; //eslint-disable-line
import RoomTypeIcon from '../containers/RoomTypeIcon';
import I18n from '../i18n';
import { isIOS } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	centerContainer: {
		flex: 1,
		height: '100%',
		marginRight: 4
	},
	title: {
		flex: 1,
		fontSize: 18,
		color: '#0C0D0F',
		fontWeight: '400',
		marginRight: 5,
		paddingTop: 0,
		paddingBottom: 0
	},
	alert: {
		fontWeight: '600'
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	titleContainer: {
		width: '100%',
		marginTop: isIOS ? 5 : 2,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	date: {
		fontSize: 14,
		color: '#9EA2A8',
		fontWeight: 'normal',
		paddingTop: 0,
		paddingBottom: 0
	},
	updateAlert: {
		color: '#1D74F5'
	},
	unreadNumberContainer: {
		minWidth: 23,
		padding: 3,
		borderRadius: 4,
		backgroundColor: '#1D74F5',
		alignItems: 'center',
		justifyContent: 'center'
	},
	unreadNumberText: {
		color: '#fff',
		overflow: 'hidden',
		fontSize: 14,
		fontWeight: '500',
		letterSpacing: 0.56
	},
	status: {
		borderRadius: 10,
		width: 10,
		height: 10,
		marginRight: 7,
		marginTop: 3
	},
	disclosureContainer: {
		height: '100%',
		marginLeft: 6,
		marginRight: 9,
		alignItems: 'center',
		justifyContent: 'center'
	},
	disclosureIndicator: {
		width: 20,
		height: 20
	},
	emptyDisclosureAndroid: {
		width: 15
	},
	markdownText: {
		flex: 1,
		color: '#9EA2A8',
		fontSize: 15,
		fontWeight: 'normal'
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

const attrs = ['name', 'unread', 'userMentions', 'alert', 'showLastMessage', 'type'];
@connect(state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	StoreLastMessage: state.settings.Store_Last_Message,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}))
export default class RoomItem extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		baseUrl: PropTypes.string.isRequired,
		StoreLastMessage: PropTypes.bool,
		_updatedAt: PropTypes.string,
		lastMessage: PropTypes.object,
		showLastMessage: PropTypes.bool,
		favorite: PropTypes.bool,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		id: PropTypes.string,
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
		showLastMessage: true,
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
		return <Avatar text={name} size={avatarSize} type={type} baseUrl={baseUrl} style={{ marginHorizontal: 15 }} user={user} />;
	}

	get lastMessage() {
		const {
			lastMessage, type, showLastMessage, StoreLastMessage, user
		} = this.props;

		if (!StoreLastMessage || !showLastMessage) {
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
		const { type, id } = this.props;
		if (type === 'd') {
			return <Status style={[styles.status]} id={id} />;
		}
		return <RoomTypeIcon type={type} size={12} />;
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	renderDisclosureIndicator = () => {
		if (isIOS) {
			return (
				<View style={styles.disclosureContainer}>
					<Image source={{ uri: 'disclosure_indicator' }} style={styles.disclosureIndicator} />
				</View>
			);
		}
		return <View style={styles.emptyDisclosureAndroid} />;
	}

	render() {
		const {
			favorite, unread, userMentions, name, _updatedAt, alert, testID, height, onPress
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
					style={[styles.container, favorite && styles.favorite, height && { height }]}
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
							<Text style={styles.markdownText} numberOfLines={2}>
								{this.lastMessage}
							</Text>
							{renderNumber(unread, userMentions)}
						</View>
					</View>
					{this.renderDisclosureIndicator()}
				</View>
			</RectButton>
		);
	}
}
