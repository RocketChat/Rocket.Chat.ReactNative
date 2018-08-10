import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, LayoutAnimation, ActivityIndicator, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import LoggedView from '../View';
import { List } from './ListView';
import { openRoom, closeRoom, setLastOpen } from '../../actions/room';
import { toggleReactionPicker, actionsShow } from '../../actions/messages';
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
	openRoom: room => dispatch(openRoom(room)),
	setLastOpen: date => dispatch(setLastOpen(date)),
	toggleReactionPicker: message => dispatch(toggleReactionPicker(message)),
	actionsShow: actionMessage => dispatch(actionsShow(actionMessage)),
	close: () => dispatch(closeRoom())
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
		close: PropTypes.func
	};

	constructor(props) {
		super('RoomView', props);
		this.rid = props.rid;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			loaded: false,
			joined: typeof props.rid === 'undefined',
			room: {},
			end: false
		};
		this.onReactionPress = this.onReactionPress.bind(this);
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	async componentWillMount() {
		this.props.navigator.setButtons({
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
		this.updateRoom();
		this.rooms.addListener(this.updateRoom);
		this.props.navigator.setDrawerEnabled({
			side: 'left',
			enabled: false
		});
		this.setState({ loaded: true });
	}
	shouldComponentUpdate(nextProps, nextState) {
		return !(equal(this.props, nextProps) && equal(this.state, nextState) && this.state.room.ro === nextState.room.ro);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.room.f !== this.state.room.f) {
			this.props.navigator.setButtons({
				rightButtons: [{
					id: 'more',
					testID: 'room-view-header-actions',
					icon: iconsMap.more
				}, {
					id: 'star',
					testID: 'room-view-header-star',
					icon: this.state.room.f ? iconsMap.star : iconsMap.starOutline
				}]
			});
		}
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
		this.onEndReached.stop();
		this.props.close();
	}

	onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'more') {
				this.props.navigator.push({
					screen: 'RoomActionsView',
					title: I18n.t('Actions'),
					passProps: {
						rid: this.state.room.rid
					}
				});
			} else if (event.id === 'star') {
				try {
					RocketChat.toggleFavorite(this.state.room.rid, this.state.room.f);
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
			try {
				const result = await RocketChat.loadMessagesForRoom({ rid: this.rid, t: this.state.room.t, latest: lastRowData.ts });
				this.setState({ end: result < 20 });
			} catch (e) {
				log('RoomView.onEndReached', e);
			}
		});
	})

	onMessageLongPress = (message) => {
		this.props.actionsShow(message);
	}

	onReactionPress = (shortname, messageId) => {
		try {
			if (!messageId) {
				RocketChat.setReaction(shortname, this.props.actionMessage._id);
				return this.props.toggleReactionPicker();
			}
			RocketChat.setReaction(shortname, messageId);
		} catch (e) {
			log('RoomView.onReactionPress', e);
		}
	};

	updateRoom = async() => {
		if (this.rooms.length > 0) {
			const { room: prevRoom } = this.state;
			const room = JSON.parse(JSON.stringify(this.rooms[0]));
			this.setState({ room });

			if (!prevRoom.rid) {
				this.props.navigator.setTitle({ title: room.name });
				this.props.openRoom({
					...room
				});
				if (room.alert || room.unread || room.userMentions) {
					this.props.setLastOpen(room.ls);
				} else {
					this.props.setLastOpen(null);
				}
			}
		}
	}

	sendMessage = (message) => {
		LayoutAnimation.easeInEaseOut();
		RocketChat.sendMessage(this.rid, message).then(() => {
			this.props.setLastOpen(null);
		});
	};

	joinRoom = async() => {
		try {
			await RocketChat.joinRoom(this.props.rid);
			this.setState({
				joined: true
			});
		} catch (e) {
			log('joinRoom', e);
		}
	};

	isOwner = () => this.state.room && this.state.room.roles && Array.from(Object.keys(this.state.room.roles), i => this.state.room.roles[i].value).includes('owner');

	isMuted = () => this.state.room && this.state.room.muted && Array.from(Object.keys(this.state.room.muted), i => this.state.room.muted[i].value).includes(this.props.user.username);

	isReadOnly = () => this.state.room.ro && this.isMuted() && !this.isOwner();

	isBlocked = () => {
		if (this.state.room) {
			const { t, blocked, blocker } = this.state.room;
			if (t === 'd' && (blocked || blocker)) {
				return true;
			}
		}
		return false;
	}

	renderItem = (item, previousItem) => (
		<Message
			key={item._id}
			item={item}
			_updatedAt={item._updatedAt}
			status={item.status}
			reactions={JSON.parse(JSON.stringify(item.reactions))}
			user={this.props.user}
			onReactionPress={this.onReactionPress}
			onLongPress={this.onMessageLongPress}
			archived={this.state.room.archived}
			broadcast={this.state.room.broadcast}
			previousItem={previousItem}
		/>
	);

	renderFooter = () => {
		// TODO: fix it
		// if (!this.state.joined) {
		// 	return (
		// 		<View>
		// 			<Text>{I18n.t('You_are_in_preview_mode')}</Text>
		// 			<Button title='Join' onPress={this.joinRoom} />
		// 		</View>
		// 	);
		// }
		if (this.state.room.archived || this.isReadOnly()) {
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
		return <MessageBox onSubmit={this.sendMessage} rid={this.rid} />;
	};

	renderHeader = () => {
		if (!this.state.end) {
			return <Text style={styles.loadingMore}>{I18n.t('Loading_messages_ellipsis')}</Text>;
		}
		return null;
	}

	renderList = () => {
		if (!this.state.loaded) {
			return <ActivityIndicator style={styles.loading} />;
		}
		return (
			<List
				key='room-view-messages'
				end={this.state.end}
				room={this.rid}
				renderFooter={this.renderHeader}
				onEndReached={this.onEndReached}
				renderRow={this.renderItem}
			/>
		);
	}

	render() {
		return (
			<SafeAreaView style={styles.container} testID='room-view'>
				{this.renderList()}
				{this.renderFooter()}
				{this.state.room._id && this.props.showActions ?
					<MessageActions room={this.state.room} user={this.props.user} /> :
					null}
				{this.props.showErrorActions ? <MessageErrorActions /> : null}
				<ReactionPicker onEmojiSelected={this.onReactionPress} />
				<UploadProgress rid={this.rid} />
			</SafeAreaView>
		);
	}
}
