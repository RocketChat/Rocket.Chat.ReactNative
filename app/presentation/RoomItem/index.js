import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import { ROW_HEIGHT } from './styles';
import { formatDate } from '../../utils/room';
import RoomItem from './RoomItem';

export { ROW_HEIGHT };

const attrs = [
	'width',
	'status',
	'connected',
	'theme',
	'isFocused',
	'forceUpdate',
	'showLastMessage'
];

class RoomItemContainer extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		showLastMessage: PropTypes.bool,
		id: PropTypes.string,
		onPress: PropTypes.func,
		username: PropTypes.string,
		avatarSize: PropTypes.number,
		testID: PropTypes.string,
		width: PropTypes.number,
		status: PropTypes.string,
		toggleFav: PropTypes.func,
		toggleRead: PropTypes.func,
		hideChannel: PropTypes.func,
		useRealName: PropTypes.bool,
		getUserPresence: PropTypes.func,
		connected: PropTypes.bool,
		theme: PropTypes.string,
		isFocused: PropTypes.bool,
		getRoomTitle: PropTypes.func,
		getRoomAvatar: PropTypes.func,
		getIsGroupChat: PropTypes.func,
		getIsRead: PropTypes.func,
		swipeEnabled: PropTypes.bool
	};

	static defaultProps = {
		avatarSize: 48,
		status: 'offline',
		getUserPresence: () => {},
		getRoomTitle: () => 'title',
		getRoomAvatar: () => '',
		getIsGroupChat: () => false,
		getIsRead: () => false,
		swipeEnabled: true
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
	}

	shouldComponentUpdate(nextProps) {
		const { props } = this;
		return !attrs.every(key => props[key] === nextProps[key]);
	}

	componentDidUpdate(prevProps) {
		const { connected, getUserPresence, id } = this.props;
		if (prevProps.connected !== connected && connected && this.isDirect) {
			getUserPresence(id);
		}
	}

	componentWillUnmount() {
		if (this.roomSubscription?.unsubscribe) {
			this.roomSubscription.unsubscribe();
		}
	}

	get isGroupChat() {
		const { item, getIsGroupChat } = this.props;
		return getIsGroupChat(item);
	}

	get isDirect() {
		const { item: { t }, id } = this.props;
		return t === 'd' && id && !this.isGroupChat;
	}

	init = () => {
		const { item } = this.props;
		if (item?.observe) {
			const observable = item.observe();
			this.roomSubscription = observable?.subscribe?.(() => {
				this.forceUpdate();
			});
		}
	}

	onPress = () => {
		const { item, onPress } = this.props;
		return onPress(item);
	}

	render() {
		const {
			item,
			getRoomTitle,
			getRoomAvatar,
			getIsRead,
			width,
			toggleFav,
			toggleRead,
			hideChannel,
			testID,
			theme,
			isFocused,
			avatarSize,
			status,
			showLastMessage,
			username,
			useRealName,
			swipeEnabled
		} = this.props;
		const name = getRoomTitle(item);
		const avatar = getRoomAvatar(item);
		const isRead = getIsRead(item);
		const date = item.lastMessage?.ts && formatDate(item.lastMessage.ts);
		const alert = (item.alert || item.tunread?.length);

		let accessibilityLabel = name;
		if (item.unread === 1) {
			accessibilityLabel += `, ${ item.unread } ${ I18n.t('alert') }`;
		} else if (item.unread > 1) {
			accessibilityLabel += `, ${ item.unread } ${ I18n.t('alerts') }`;
		}

		if (item.userMentions > 0) {
			accessibilityLabel += `, ${ I18n.t('you_were_mentioned') }`;
		}

		if (date) {
			accessibilityLabel += `, ${ I18n.t('last_message') } ${ date }`;
		}

		return (
			<RoomItem
				name={name}
				avatar={avatar}
				isGroupChat={this.isGroupChat}
				isRead={isRead}
				onPress={this.onPress}
				date={date}
				accessibilityLabel={accessibilityLabel}
				width={width}
				favorite={item.f}
				toggleFav={toggleFav}
				rid={item.rid}
				toggleRead={toggleRead}
				hideChannel={hideChannel}
				testID={testID}
				type={item.t}
				theme={theme}
				isFocused={isFocused}
				size={avatarSize}
				prid={item.prid}
				status={status}
				hideUnreadStatus={item.hideUnreadStatus}
				alert={alert}
				roomUpdatedAt={item.roomUpdatedAt}
				lastMessage={item.lastMessage}
				showLastMessage={showLastMessage}
				username={username}
				useRealName={useRealName}
				unread={item.unread}
				userMentions={item.userMentions}
				groupMentions={item.groupMentions}
				tunread={item.tunread}
				tunreadUser={item.tunreadUser}
				tunreadGroup={item.tunreadGroup}
				swipeEnabled={swipeEnabled}
			/>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	let status = 'offline';
	const { id, type, visitor = {} } = ownProps;
	if (state.meteor.connected) {
		if (type === 'd') {
			status = state.activeUsers[id]?.status || 'offline';
		} else if (type === 'l' && visitor?.status) {
			({ status } = visitor);
		}
	}
	return {
		connected: state.meteor.connected,
		status
	};
};

export default connect(mapStateToProps)(RoomItemContainer);
