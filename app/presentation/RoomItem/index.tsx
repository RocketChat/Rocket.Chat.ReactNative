import React from 'react';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import { ROW_HEIGHT, ROW_HEIGHT_CONDENSED } from './styles';
import { formatDate } from '../../utils/room';
import RoomItem from './RoomItem';
import { TUserStatus } from '../../definitions/UserStatus';

export { ROW_HEIGHT, ROW_HEIGHT_CONDENSED };
interface IRoomItemContainerProps {
	item: any;
	showLastMessage: boolean;
	id: string;
	onPress: Function;
	onLongPress: Function;
	username: string;
	avatarSize: number;
	width: number;
	status: TUserStatus;
	toggleFav(): void;
	toggleRead(): void;
	hideChannel(): void;
	useRealName: boolean;
	getUserPresence: Function;
	connected: boolean;
	theme: string;
	isFocused: boolean;
	getRoomTitle: Function;
	getRoomAvatar: Function;
	getIsGroupChat: Function;
	getIsRead: Function;
	swipeEnabled: boolean;
	autoJoin: boolean;
	showAvatar: boolean;
	displayMode: string;
}

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
	private mounted: boolean;

	private roomSubscription: any;

	static defaultProps: Partial<IRoomItemContainerProps> = {
		avatarSize: 48,
		status: 'online',
		getUserPresence: () => {},
		getRoomTitle: () => 'title',
		getRoomAvatar: () => '',
		getIsGroupChat: () => false,
		getIsRead: () => false,
		swipeEnabled: true
	};

	constructor(props: IRoomItemContainerProps) {
		super(props);
		this.mounted = false;
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
		const { connected, getUserPresence, id } = this.props;
		if (connected && this.isDirect) {
			getUserPresence(id);
		}
	}

	shouldComponentUpdate(nextProps: any) {
		const { props }: any = this;
		return !attrs.every(key => props[key] === nextProps[key]);
	}

	componentDidUpdate(prevProps: any) {
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
		}: any = this.props;
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
			avatarSize,
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
			// @ts-ignore
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
				size={avatarSize}
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
