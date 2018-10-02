import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, LayoutAnimation, ActivityIndicator, SafeAreaView
} from 'react-native';
import { connect, Provider } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';

import { openRoom as openRoomAction, closeRoom as closeRoomAction, setLastOpen as setLastOpenAction } from '../../actions/room';
import { toggleReactionPicker as toggleReactionPickerAction, actionsShow as actionsShowAction } from '../../actions/messages';
import LoggedView from '../View';
import { List } from './ListView';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import ReactionPicker from './ReactionPicker';
import UploadProgress from './UploadProgress';
import styles from './styles';
import log from '../../utils/log';
import I18n from '../../i18n';
import debounce from '../../utils/debounce';
import { iconsMap } from '../../Icons';
import store from '../../lib/createStore';
import ConnectionBadge from '../../containers/ConnectionBadge';

let RoomActionsView = null;

@connect(state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	actionMessage: state.messages.actionMessage,
	showActions: state.messages.showActions,
	showErrorActions: state.messages.showErrorActions
}), dispatch => ({
	openRoom: room => dispatch(openRoomAction(room)),
	setLastOpen: date => dispatch(setLastOpenAction(date)),
	toggleReactionPicker: message => dispatch(toggleReactionPickerAction(message)),
	actionsShow: actionMessage => dispatch(actionsShowAction(actionMessage)),
	closeRoom: () => dispatch(closeRoomAction())
}))
/** @extends React.Component */
export default class RoomView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		openRoom: PropTypes.func.isRequired,
		setLastOpen: PropTypes.func.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		rid: PropTypes.string,
		showActions: PropTypes.bool,
		showErrorActions: PropTypes.bool,
		actionMessage: PropTypes.object,
		toggleReactionPicker: PropTypes.func.isRequired,
		actionsShow: PropTypes.func,
		closeRoom: PropTypes.func
	};

	constructor(props) {
		super('RoomView', props);
		this.rid = props.rid;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			loaded: false,
			joined: this.rooms.length > 0,
			room: {},
			end: false
		};
		this.onReactionPress = this.onReactionPress.bind(this);
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentWillMount() {
		const { navigator } = this.props;

		navigator.setButtons({
			rightButtons: [{
				id: 'more',
				testID: 'room-view-header-actions',
				icon: iconsMap.more
			}, {
				id: 'star',
				testID: 'room-view-header-star',
				icon: iconsMap.starOutline
			}]
		});
	}

	componentDidMount() {
		const { navigator } = this.props;

		this.updateRoom();
		this.rooms.addListener(this.updateRoom);
		navigator.setDrawerEnabled({
			side: 'left',
			enabled: false
		});
		this.setState({ loaded: true });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			room, loaded, joined, end
		} = this.state;
		const { showActions } = this.props;

		if (room.ro !== nextState.room.ro) {
			return true;
		} else if (loaded !== nextState.loaded) {
			return true;
		} else if (joined !== nextState.joined) {
			return true;
		} else if (end !== nextState.end) {
			return true;
		} else if (showActions !== nextProps.showActions) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps, prevState) {
		const { room } = this.state;
		const { navigator } = this.props;

		if (prevState.room.f !== room.f) {
			navigator.setButtons({
				rightButtons: [{
					id: 'more',
					testID: 'room-view-header-actions',
					icon: iconsMap.more
				}, {
					id: 'star',
					testID: 'room-view-header-star',
					icon: room.f ? iconsMap.star : iconsMap.starOutline
				}]
			});
		}
	}

	componentWillUnmount() {
		const { closeRoom } = this.props;
		this.rooms.removeAllListeners();
		this.onEndReached.stop();
		closeRoom();
	}

	onNavigatorEvent(event) {
		const { room } = this.state;
		const { rid, f } = room;
		const { navigator } = this.props;

		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'more') {
				if (RoomActionsView == null) {
					RoomActionsView = require('../RoomActionsView').default;
					Navigation.registerComponent('RoomActionsView', () => RoomActionsView, store, Provider);
				}

				navigator.push({
					screen: 'RoomActionsView',
					title: I18n.t('Actions'),
					backButtonTitle: '',
					passProps: {
						rid
					}
				});
			} else if (event.id === 'star') {
				try {
					RocketChat.toggleFavorite(rid, f);
				} catch (e) {
					log('toggleFavorite', e);
				}
			}
		}
	}

	onEndReached = debounce((lastRowData) => {
		if (!lastRowData) {
			this.setState({ end: true });
			return;
		}

		requestAnimationFrame(async() => {
			const { room } = this.state;
			try {
				const result = await RocketChat.loadMessagesForRoom({ rid: this.rid, t: room.t, latest: lastRowData.ts });
				this.setState({ end: result < 20 });
			} catch (e) {
				log('RoomView.onEndReached', e);
			}
		});
	})

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

	updateRoom = async() => {
		const { navigator, openRoom, setLastOpen } = this.props;

		if (this.rooms.length > 0) {
			const { room: prevRoom } = this.state;
			const room = JSON.parse(JSON.stringify(this.rooms[0]));
			this.setState({ room });

			if (!prevRoom.rid) {
				navigator.setTitle({ title: room.name });
				openRoom({
					...room
				});
				if (room.alert || room.unread || room.userMentions) {
					setLastOpen(room.ls);
				} else {
					setLastOpen(null);
				}
			}
		} else {
			openRoom({ rid: this.rid });
			this.setState({ joined: false });
		}
	}

	sendMessage = (message) => {
		const { setLastOpen } = this.props;
		LayoutAnimation.easeInEaseOut();
		RocketChat.sendMessage(this.rid, message).then(() => {
			setLastOpen(null);
		});
	};

	joinRoom = async() => {
		const { rid } = this.props;
		try {
			await RocketChat.joinRoom(rid);
			this.setState({
				joined: true
			});
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
		return room && room.muted && Array.from(Object.keys(room.muted), i => room.muted[i].value).includes(user.username);
	}

	isReadOnly = () => {
		const { room } = this.state;
		return room.ro && this.isMuted() && !this.isOwner();
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
		const { room } = this.state;
		const { user } = this.props;

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
		const { joined, room } = this.state;

		if (!joined) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-join'>
					<Text style={styles.previewMode}>{I18n.t('You_are_in_preview_mode')}</Text>
					<RectButton
						onPress={this.joinRoom}
						style={styles.joinRoomButton}
						activeOpacity={0.5}
						underlayColor='#fff'
					>
						<Text style={styles.joinRoomText}>{I18n.t('Join')}</Text>
					</RectButton>
				</View>
			);
		}
		if (room.archived || this.isReadOnly()) {
			return (
				<View style={styles.readOnly}>
					<Text>{I18n.t('This_room_is_read_only')}</Text>
				</View>
			);
		}
		if (this.isBlocked()) {
			return (
				<View style={styles.blockedOrBlocker}>
					<Text>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}
		return <MessageBox key='room-view-messagebox' onSubmit={this.sendMessage} rid={this.rid} />;
	};

	renderHeader = () => {
		const { end } = this.state;
		if (!end) {
			return <ActivityIndicator style={[styles.loading, { transform: [{ scaleY: -1 }] }]} />;
		}
		return null;
	}

	renderList = () => {
		const { loaded, end } = this.state;
		if (!loaded) {
			return <ActivityIndicator style={styles.loading} />;
		}
		return (
			[
				<List
					key='room-view-messages'
					end={end}
					room={this.rid}
					renderFooter={this.renderHeader}
					onEndReached={this.onEndReached}
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
			<SafeAreaView style={styles.container} testID='room-view'>
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
