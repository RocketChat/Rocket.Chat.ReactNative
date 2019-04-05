import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, LayoutAnimation, InteractionManager
} from 'react-native';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import moment from 'moment';
import 'react-native-console-time-polyfill';

import {
	toggleReactionPicker as toggleReactionPickerAction,
	actionsShow as actionsShowAction,
	messagesRequest as messagesRequestAction,
	editCancel as editCancelAction,
	replyCancel as replyCancelAction
} from '../../actions/messages';
import LoggedView from '../View';
import { List } from './List';
import database, { safeAddListener } from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import ReactionPicker from './ReactionPicker';
import UploadProgress from './UploadProgress';
import styles from './styles';
import log from '../../utils/log';
import { isIOS } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import ConnectionBadge from '../../containers/ConnectionBadge';
import { CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import RoomHeaderView from './Header';
import StatusBar from '../../containers/StatusBar';
import Separator from './Separator';
import { COLOR_WHITE } from '../../constants/colors';
import debounce from '../../utils/debounce';

@connect(state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	actionMessage: state.messages.actionMessage,
	showActions: state.messages.showActions,
	showErrorActions: state.messages.showErrorActions,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	useRealName: state.settings.UI_Use_Real_Name
}), dispatch => ({
	editCancel: () => dispatch(editCancelAction()),
	replyCancel: () => dispatch(replyCancelAction()),
	toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message)),
	actionsShow: actionMessage => dispatch(actionsShowAction(actionMessage)),
	messagesRequest: room => dispatch(messagesRequestAction(room))
}))
/** @extends React.Component */
export default class RoomView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const rid = navigation.getParam('rid');
		const prid = navigation.getParam('prid');
		const title = navigation.getParam('name');
		const t = navigation.getParam('t');
		return {
			headerTitle: <RoomHeaderView rid={rid} prid={prid} title={title} type={t} />,
			headerRight: t === 'l'
				? null
				: (
					<CustomHeaderButtons>
						<Item title='more' iconName='menu' onPress={() => navigation.navigate('RoomActionsView', { rid, t })} testID='room-view-header-actions' />
					</CustomHeaderButtons>
				)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		showActions: PropTypes.bool,
		showErrorActions: PropTypes.bool,
		actionMessage: PropTypes.object,
		appState: PropTypes.string,
		useRealName: PropTypes.bool,
		toggleReactionPicker: PropTypes.func.isRequired,
		actionsShow: PropTypes.func,
		messagesRequest: PropTypes.func,
		editCancel: PropTypes.func,
		replyCancel: PropTypes.func
	};

	constructor(props) {
		super('RoomView', props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);
		this.rid = props.navigation.getParam('rid');
		this.t = props.navigation.getParam('t');
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			joined: this.rooms.length > 0,
			room: this.rooms[0] || { rid: this.rid, t: this.t },
			lastOpen: null
		};
		this.beginAnimating = false;
		this.beginAnimatingTimeout = setTimeout(() => this.beginAnimating = true, 300);
		this.messagebox = React.createRef();
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.didMountInteraction = InteractionManager.runAfterInteractions(async() => {
			const { room } = this.state;
			const { messagesRequest, navigation } = this.props;
			messagesRequest(room);

			// if room is joined
			if (room._id) {
				navigation.setParams({ name: this.getRoomTitle(room), t: room.t });
				this.sub = await RocketChat.subscribeRoom(room);
				RocketChat.readMessages(room.rid);
				if (room.alert || room.unread || room.userMentions) {
					this.setLastOpen(room.ls);
				} else {
					this.setLastOpen(null);
				}
			}
			safeAddListener(this.rooms, this.updateRoom);
		});
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			room, joined
		} = this.state;
		const { showActions, showErrorActions, appState } = this.props;

		if (room.ro !== nextState.room.ro) {
			return true;
		} else if (room.f !== nextState.room.f) {
			return true;
		} else if (room.blocked !== nextState.room.blocked) {
			return true;
		} else if (room.blocker !== nextState.room.blocker) {
			return true;
		} else if (room.archived !== nextState.room.archived) {
			return true;
		} else if (joined !== nextState.joined) {
			return true;
		} else if (showActions !== nextProps.showActions) {
			return true;
		} else if (showErrorActions !== nextProps.showErrorActions) {
			return true;
		} else if (appState !== nextProps.appState) {
			return true;
		} else if (!equal(room.muted, nextState.room.muted)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const { room } = this.state;
		const { appState } = this.props;

		if (appState === 'foreground' && appState !== prevProps.appState) {
			this.onForegroundInteraction = InteractionManager.runAfterInteractions(() => {
				RocketChat.loadMissedMessages(room).catch(e => console.log(e));
				RocketChat.readMessages(room.rid).catch(e => console.log(e));
			});
		}
	}

	componentWillUnmount() {
		if (this.messagebox && this.messagebox.current && this.messagebox.current.text) {
			const { text } = this.messagebox.current;
			database.write(() => {
				const [room] = this.rooms;
				room.draftMessage = text;
			});
		}
		this.rooms.removeAllListeners();
		if (this.sub && this.sub.stop) {
			this.sub.stop();
		}
		if (this.beginAnimatingTimeout) {
			clearTimeout(this.beginAnimatingTimeout);
		}
		const { editCancel, replyCancel } = this.props;
		editCancel();
		replyCancel();
		if (this.didMountInteraction && this.didMountInteraction.cancel) {
			this.didMountInteraction.cancel();
		}
		if (this.onForegroundInteraction && this.onForegroundInteraction.cancel) {
			this.onForegroundInteraction.cancel();
		}
		if (this.updateStateInteraction && this.updateStateInteraction.cancel) {
			this.updateStateInteraction.cancel();
		}
		console.countReset(`${ this.constructor.name }.render calls`);
	}

	onMessageLongPress = (message) => {
		const { actionsShow } = this.props;
		actionsShow(message);
	}

	onReactionPress = (shortname, messageId) => {
		const { actionMessage, toggleReactionPicker } = this.props;
		try {
			if (!messageId) {
				RocketChat.setReaction(shortname, actionMessage._id);
				return toggleReactionPicker();
			}
			RocketChat.setReaction(shortname, messageId);
		} catch (e) {
			log('RoomView.onReactionPress', e);
		}
	};

	onDiscussionPress = debounce((item) => {
		const { navigation } = this.props;
		navigation.push('RoomView', {
			rid: item.drid, prid: item.rid, name: item.msg, t: 'p'
		});
	}, 1000, true)

	internalSetState = (...args) => {
		if (isIOS && this.beginAnimating) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	updateRoom = () => {
		this.updateStateInteraction = InteractionManager.runAfterInteractions(() => {
			const room = JSON.parse(JSON.stringify(this.rooms[0] || {}));
			this.internalSetState({ room });
		});
	}

	sendMessage = (message) => {
		LayoutAnimation.easeInEaseOut();
		RocketChat.sendMessage(this.rid, message).then(() => {
			this.setLastOpen(null);
		});
	};

	getRoomTitle = (room) => {
		const { useRealName } = this.props;
		return ((room.prid || useRealName) && room.fname) || room.name;
	}

	setLastOpen = lastOpen => this.setState({ lastOpen });

	joinRoom = async() => {
		try {
			const result = await RocketChat.joinRoom(this.rid);
			if (result.success) {
				this.internalSetState({
					joined: true
				});
			}
		} catch (e) {
			log('joinRoom', e);
		}
	};

	isOwner = () => {
		const { room } = this.state;
		return room && room.roles && Array.from(Object.keys(room.roles), i => room.roles[i].value).includes('owner');
	}

	isMuted = () => {
		const { room } = this.state;
		const { user } = this.props;
		return room && room.muted && !!Array.from(Object.keys(room.muted), i => room.muted[i].value).includes(user.username);
	}

	isReadOnly = () => {
		const { room } = this.state;
		return (room.ro && !room.broadcast) || this.isMuted() || room.archived;
	}

	isBlocked = () => {
		const { room } = this.state;

		if (room) {
			const { t, blocked, blocker } = room;
			if (t === 'd' && (blocked || blocker)) {
				return true;
			}
		}
		return false;
	}

	renderItem = (item, previousItem) => {
		const { room, lastOpen } = this.state;
		const { user } = this.props;
		let dateSeparator = null;
		let showUnreadSeparator = false;

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = moment(item.ts).isAfter(lastOpen);
		} else {
			showUnreadSeparator = lastOpen
				&& moment(item.ts).isAfter(lastOpen)
				&& moment(previousItem.ts).isBefore(lastOpen);
			if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
				dateSeparator = item.ts;
			}
		}

		if (showUnreadSeparator || dateSeparator) {
			return (
				<React.Fragment>
					<Message
						key={item._id}
						item={item}
						status={item.status}
						reactions={JSON.parse(JSON.stringify(item.reactions))}
						user={user}
						archived={room.archived}
						broadcast={room.broadcast}
						previousItem={previousItem}
						_updatedAt={item._updatedAt}
						onReactionPress={this.onReactionPress}
						onLongPress={this.onMessageLongPress}
						onDiscussionPress={this.onDiscussionPress}
					/>
					<Separator
						ts={dateSeparator}
						unread={showUnreadSeparator}
					/>
				</React.Fragment>
			);
		}

		return (
			<Message
				key={item._id}
				item={item}
				status={item.status}
				reactions={JSON.parse(JSON.stringify(item.reactions))}
				user={user}
				archived={room.archived}
				broadcast={room.broadcast}
				previousItem={previousItem}
				_updatedAt={item._updatedAt}
				onReactionPress={this.onReactionPress}
				onLongPress={this.onMessageLongPress}
				onDiscussionPress={this.onDiscussionPress}
			/>
		);
	}

	renderFooter = () => {
		const { joined, room } = this.state;

		if (!joined) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
					<Text style={styles.previewMode}>{I18n.t('You_are_in_preview_mode')}</Text>
					<RectButton
						onPress={this.joinRoom}
						style={styles.joinRoomButton}
						activeOpacity={0.5}
						underlayColor={COLOR_WHITE}
					>
						<Text style={styles.joinRoomText} testID='room-view-join-button'>{I18n.t('Join')}</Text>
					</RectButton>
				</View>
			);
		}
		if (this.isReadOnly()) {
			return (
				<View style={styles.readOnly}>
					<Text style={styles.previewMode}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if (this.isBlocked()) {
			return (
				<View style={styles.readOnly}>
					<Text style={styles.previewMode}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}
		return <MessageBox ref={this.messagebox} onSubmit={this.sendMessage} rid={this.rid} roomType={room.t} />;
	};

	renderList = () => {
		const { room } = this.state;
		const { rid, t } = room;
		return (
			<React.Fragment>
				<List rid={rid} t={t} renderRow={this.renderItem} />
				{this.renderFooter()}
			</React.Fragment>
		);
	}

	render() {
		console.count(`${ this.constructor.name }.render calls`);
		const { room } = this.state;
		const { user, showActions, showErrorActions } = this.props;

		return (
			<SafeAreaView style={styles.container} testID='room-view' forceInset={{ bottom: 'never' }}>
				<StatusBar />
				{this.renderList()}
				{room._id && showActions
					? <MessageActions room={room} user={user} />
					: null
				}
				{showErrorActions ? <MessageErrorActions /> : null}
				<ReactionPicker onEmojiSelected={this.onReactionPress} />
				<UploadProgress rid={this.rid} />
				<ConnectionBadge />
			</SafeAreaView>
		);
	}
}
