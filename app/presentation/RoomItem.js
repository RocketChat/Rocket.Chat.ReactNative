import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, ViewPropTypes } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { connect } from 'react-redux';

import Avatar from '../containers/Avatar';
import Status from '../containers/status';
import Touch from '../utils/touch/index'; //eslint-disable-line
import Markdown from '../containers/message/Markdown';
import RoomTypeIcon from '../containers/RoomTypeIcon';
import I18n from '../i18n';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		alignItems: 'center',
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
		marginRight: 8
	},
	lastMessage: {
		flex: 1,
		flexShrink: 1,
		marginRight: 8,
		maxHeight: 20,
		overflow: 'hidden',
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'flex-start'
	},
	alert: {
		fontWeight: 'bold'
	},
	favorite: {
		// backgroundColor: '#eee'
	},
	row: {
		// width: '100%',
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
		// justifyContent: 'flex-end'
	},
	firstRow: {
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
	},
	updateAlert: {
		color: '#1d74f5'
	},
	status: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		borderWidth: 3,
		borderColor: '#fff'
	},
	type: {
		marginRight: 5,
		marginTop: 3
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

const attrs = ['name', 'unread', 'userMentions', 'alert', 'showLastMessage', 'type'];
@connect(state => ({
	username: state.login.user && state.login.user.username,
	StoreLastMessage: state.settings.Store_Last_Message
}))
export default class RoomItem extends React.Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		StoreLastMessage: PropTypes.bool,
		_updatedAt: PropTypes.instanceOf(Date),
		lastMessage: PropTypes.object,
		showLastMessage: PropTypes.bool,
		favorite: PropTypes.bool,
		alert: PropTypes.bool,
		unread: PropTypes.number,
		userMentions: PropTypes.number,
		id: PropTypes.string,
		onPress: PropTypes.func,
		onLongPress: PropTypes.func,
		username: PropTypes.string,
		avatarSize: PropTypes.number,
		statusStyle: ViewPropTypes.style,
		testID: PropTypes.string
	}

	static defaultProps = {
		showLastMessage: true,
		avatarSize: 46
	}
	shouldComponentUpdate(nextProps) {
		const oldlastMessage = this.props.lastMessage;
		const newLastmessage = nextProps.lastMessage;

		if (oldlastMessage && newLastmessage && oldlastMessage.ts.toGMTString() !== newLastmessage.ts.toGMTString()) {
			return true;
		}
		if (this.props._updatedAt && nextProps._updatedAt && nextProps._updatedAt.toGMTString() !== this.props._updatedAt.toGMTString()) {
			return true;
		}
		return attrs.some(key => nextProps[key] !== this.props[key]);
	}
	get icon() {
		const {
			type, name, id, avatarSize, statusStyle
		} = this.props;
		return (<Avatar text={name} size={avatarSize} type={type}>{type === 'd' ? <Status style={[styles.status, statusStyle]} id={id} /> : null }</Avatar>);
	}

	get lastMessage() {
		const {
			lastMessage, type, showLastMessage
		} = this.props;

		if (!this.props.StoreLastMessage || !showLastMessage) {
			return '';
		}
		if (!lastMessage) {
			return I18n.t('No_Message');
		}

		let prefix = '';

		if (lastMessage.u.username === this.props.username) {
			prefix = I18n.t('You_colon');
		}	else if (type !== 'd') {
			prefix = `${ lastMessage.u.username }: `;
		}

		const msg = `${ prefix }${ lastMessage.msg.replace(/[\n\t\r]/igm, '') }`;
		const maxChars = 35;
		return `${ msg.slice(0, maxChars) }${ msg.replace(/:[a-z0-9]+:/gi, ':::').length > maxChars ? '...' : '' }`;
	}

	get type() {
		const icon = {
			c: 'pound',
			p: 'lock',
			l: 'account',
			d: 'at'
		}[this.props.type];
		return <Icon name={icon} size={15} style={styles.type} />;
	}

	formatDate = date => moment(date).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	})

	render() {
		const {
			favorite, unread, userMentions, name, _updatedAt, alert, type, testID
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
			<Touch
				onPress={this.props.onPress}
				onLongPress={this.props.onLongPress}
				underlayColor='#FFFFFF'
				activeOpacity={0.5}
				accessibilityLabel={accessibilityLabel}
				accessibilityTraits='selected'
				testID={testID}
			>
				<View style={[styles.container, favorite && styles.favorite]}>
					{this.icon}
					<View style={styles.roomNameView}>
						<View style={styles.firstRow}>
							<RoomTypeIcon type={type} />
							<Text style={[styles.roomName, alert && styles.alert]} ellipsizeMode='tail' numberOfLines={1}>{ name }</Text>
							{_updatedAt ? <Text style={[styles.update, alert && styles.updateAlert]} ellipsizeMode='tail' numberOfLines={1}>{ date }</Text> : null}
						</View>
						<View style={styles.row}>
							<Markdown
								msg={this.lastMessage}
								style={{
									root: {
										flex: 1
									}
								}}
								rules={{
									mention: node => (
										<Text key={node.key}>
											@{node.content}
										</Text>
									),
									hashtag: node => (
										<Text key={node.key}>
											#{node.content}
										</Text>
									)
								}}
							/>
							{renderNumber(unread, userMentions)}
						</View>
					</View>
				</View>
			</Touch>
		);
	}
}
