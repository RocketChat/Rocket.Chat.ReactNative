import React from 'react';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import { ROW_HEIGHT, ROW_HEIGHT_CONDENSED } from './styles';
import { formatDate } from '../../lib/methods/helpers/room';
import RoomItem from './RoomItem';
import { ISubscription, TUserStatus } from '../../definitions';
import { IRoomItemContainerProps } from './interfaces';

export { ROW_HEIGHT, ROW_HEIGHT_CONDENSED };

const attrs = [
	'width',
	'status',
	'connected',
	'theme',
	'isFocused',
	'forceUpdate',
	'showLastMessage',
	'autoJoin',
	'showAvatar',
	'displayMode'
];

class RoomItemContainer extends React.Component<IRoomItemContainerProps, any> {
	private roomSubscription: ISubscription | undefined;

	static defaultProps: Partial<IRoomItemContainerProps> = {
		status: 'offline',
		getUserPresence: () => {},
		getRoomTitle: () => 'title',
		getRoomAvatar: () => '',
		getIsGroupChat: () => false,
		getIsRead: () => false,
		swipeEnabled: true
	};

	constructor(props: IRoomItemContainerProps) {
		super(props);
		this.init();
	}

	componentDidMount() {
		const { connected, getUserPresence, id } = this.props;
		if (connected && this.isDirect) {
			getUserPresence(id);
		}
	}

	shouldComponentUpdate(nextProps: IRoomItemContainerProps) {
		const { props } = this;
		return !attrs.every(key => props[key] === nextProps[key]);
	}

	componentDidUpdate(prevProps: IRoomItemContainerProps) {
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
		const {
			item: { t },
			id
		} = this.props;
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
	};

	onPress = () => {
		const { item, onPress } = this.props;
		return onPress(item);
	};

	onLongPress = () => {
		const { item, onLongPress } = this.props;
		if (onLongPress) {
			return onLongPress(item);
		}
	};

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
			theme,
			isFocused,
			status,
			showLastMessage,
			username,
			useRealName,
			swipeEnabled,
			autoJoin,
			showAvatar,
			displayMode
		} = this.props;
		const name = getRoomTitle(item);
		const testID = `rooms-list-view-item-${name}`;
		const avatar = getRoomAvatar(item);
		const isRead = getIsRead(item);
		const date = item.roomUpdatedAt && formatDate(item.roomUpdatedAt);
		const alert = item.alert || item.tunread?.length;

		let accessibilityLabel = name;
		if (item.unread === 1) {
			accessibilityLabel += `, ${item.unread} ${I18n.t('alert')}`;
		} else if (item.unread > 1) {
			accessibilityLabel += `, ${item.unread} ${I18n.t('alerts')}`;
		}

		if (item.userMentions > 0) {
			accessibilityLabel += `, ${I18n.t('you_were_mentioned')}`;
		}

		if (date) {
			accessibilityLabel += `, ${I18n.t('last_message')} ${date}`;
		}

		return (
			<RoomItem
				name={name}
				avatar={avatar}
				isGroupChat={this.isGroupChat}
				isRead={isRead}
				onPress={this.onPress}
				onLongPress={this.onLongPress}
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
				prid={item.prid}
				status={status}
				hideUnreadStatus={item.hideUnreadStatus}
				alert={alert}
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
				teamMain={item.teamMain}
				autoJoin={autoJoin}
				showAvatar={showAvatar}
				displayMode={displayMode}
				sourceType={item.source}
			/>
		);
	}
}

const mapStateToProps = (state: any, ownProps: any) => {
	let status = 'loading';
	const { id, type, visitor = {} } = ownProps;
	if (state.meteor.connected) {
		if (type === 'd') {
			status = state.activeUsers[id]?.status || 'loading';
		} else if (type === 'l' && visitor?.status) {
			({ status } = visitor);
		}
	}
	return {
		connected: state.meteor.connected,
		status: status as TUserStatus
	};
};

export default connect(mapStateToProps)(RoomItemContainer);
