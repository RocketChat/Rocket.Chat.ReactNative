import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, LayoutAnimation, ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import moment from 'moment';

import { openRoom as openRoomAction, closeRoom as closeRoomAction } from '../../actions/room';
import { toggleReactionPicker as toggleReactionPickerAction, actionsShow as actionsShowAction } from '../../actions/messages';
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

@connect(state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	actionMessage: state.messages.actionMessage,
	showActions: state.messages.showActions,
	showErrorActions: state.messages.showErrorActions,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background'
}), dispatch => ({
	openRoom: room => dispatch(openRoomAction(room)),
	toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message)),
	actionsShow: actionMessage => dispatch(actionsShowAction(actionMessage)),
	closeRoom: () => dispatch(closeRoomAction())
}))
/** @extends React.Component */
export default class RoomView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const rid = navigation.getParam('rid');
		const t = navigation.getParam('t');
		const f = navigation.getParam('f');
		const toggleFav = navigation.getParam('toggleFav', () => {});
		const starIcon = f ? 'Star-filled' : 'star';
		return {
			headerTitle: <RoomHeaderView />,
			headerRight: t === 'l'
				? null
				: (
					<CustomHeaderButtons>
						<Item title='star' iconName={starIcon} onPress={toggleFav} testID='room-view-header-star' />
						<Item title='more' iconName='menu' onPress={() => navigation.navigate('RoomActionsView', { rid })} testID='room-view-header-actions' />
					</CustomHeaderButtons>
				)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		openRoom: PropTypes.func.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		showActions: PropTypes.bool,
		showErrorActions: PropTypes.bool,
		actionMessage: PropTypes.object,
		appState: PropTypes.string,
		toggleReactionPicker: PropTypes.func.isRequired,
		actionsShow: PropTypes.func,
		closeRoom: PropTypes.func
	};

	constructor(props) {
		super('RoomView', props);
		this.rid = props.navigation.getParam('rid');
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			loaded: false,
			joined: this.rooms.length > 0,
			room: {},
			lastOpen: null
		};
		this.beginAnimating = false;
		this.onReactionPress = this.onReactionPress.bind(this);
		setTimeout(() => {
			this.beginAnimating = true;
		}, 300);
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ toggleFav: this.toggleFav });

		if (this.rooms.length === 0 && this.rid) {
			const { rid, name, t } = navigation.state.params;
			this.setState(
				{ room: { rid, name, t } },
				() => this.updateRoom()
			);
		}
		safeAddListener(this.rooms, this.updateRoom);
		this.internalSetState({ loaded: true });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			room, loaded, joined
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
		} else if (loaded !== nextState.loaded) {
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

	componentDidUpdate(prevProps, prevState) {
		const { room } = this.state;
		const { appState, navigation } = this.props;

		if (prevState.room.f !== room.f) {
			navigation.setParams({ f: room.f });
		} else if (appState === 'foreground' && appState !== prevProps.appState) {
			RocketChat.loadMissedMessages(room).catch(e => console.log(e));
			RocketChat.readMessages(room.rid).catch(e => console.log(e));
		}
	}

	componentWillUnmount() {
		const { closeRoom } = this.props;
		closeRoom();
		this.rooms.removeAllListeners();
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

	internalSetState = (...args) => {
		if (isIOS && this.beginAnimating) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	// eslint-disable-next-line react/sort-comp
	updateRoom = () => {
		const { openRoom } = this.props;

		if (this.rooms.length > 0) {
			const { room: prevRoom } = this.state;
			const room = JSON.parse(JSON.stringify(this.rooms[0] || {}));
			this.internalSetState({ room });

			if (!prevRoom._id) {
				openRoom({
					...room
				});
				if (room.alert || room.unread || room.userMentions) {
					this.setLastOpen(room.ls);
				} else {
					this.setLastOpen(null);
				}
			}
		} else {
			const { room } = this.state;
			if (room.rid) {
				openRoom(room);
				this.internalSetState({ joined: false });
			}
		}
	}

	toggleFav = () => {
		try {
			const { room } = this.state;
			const { rid, f } = room;
			RocketChat.toggleFavorite(rid, !f);
		} catch (e) {
			log('toggleFavorite', e);
		}
	}

	sendMessage = (message) => {
		LayoutAnimation.easeInEaseOut();
		RocketChat.sendMessage(this.rid, message).then(() => {
			this.setLastOpen(null);
		});
	};

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
				dateSeparator = previousItem.ts;
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
			/>
		);
	}

	renderFooter = () => {
		const { joined } = this.state;

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
				<View style={styles.readOnly} key='room-view-read-only'>
					<Text style={styles.previewMode}>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if (this.isBlocked()) {
			return (
				<View style={styles.readOnly} key='room-view-block'>
					<Text style={styles.previewMode}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}
		return <MessageBox key='room-view-messagebox' onSubmit={this.sendMessage} rid={this.rid} />;
	};

	renderList = () => {
		const { loaded, room } = this.state;
		if (!loaded || !room.rid) {
			return <ActivityIndicator style={styles.loading} />;
		}
		return (
			[
				<List
					key='room-view-messages'
					room={room}
					renderRow={this.renderItem}
				/>,
				this.renderFooter()
			]
		);
	}

	render() {
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
