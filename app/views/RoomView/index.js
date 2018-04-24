import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, Button } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import equal from 'deep-equal';

import LoggedView from '../View';
import { List } from './ListView';
import * as actions from '../../actions';
import { openRoom, setLastOpen } from '../../actions/room';
import { editCancel, toggleReactionPicker, actionsShow } from '../../actions/messages';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import Header from '../../containers/Header';
import RoomsHeader from './Header';
import ReactionPicker from './ReactionPicker';
import styles from './styles';

@connect(
	state => ({
		Site_Url: state.settings.Site_Url || state.server ? state.server.server : '',
		Message_TimeFormat: state.settings.Message_TimeFormat,
		loading: state.messages.isFetching,
		user: state.login.user,
		actionMessage: state.messages.actionMessage,
		layoutAnimation: state.room.layoutAnimation
	}),
	dispatch => ({
		actions: bindActionCreators(actions, dispatch),
		openRoom: room => dispatch(openRoom(room)),
		editCancel: () => dispatch(editCancel()),
		setLastOpen: date => dispatch(setLastOpen(date)),
		toggleReactionPicker: message => dispatch(toggleReactionPicker(message)),
		actionsShow: actionMessage => dispatch(actionsShow(actionMessage))
	})
)
export default class RoomView extends LoggedView {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		openRoom: PropTypes.func.isRequired,
		setLastOpen: PropTypes.func.isRequired,
		user: PropTypes.object.isRequired,
		editCancel: PropTypes.func,
		rid: PropTypes.string,
		name: PropTypes.string,
		Site_Url: PropTypes.string,
		Message_TimeFormat: PropTypes.string,
		loading: PropTypes.bool,
		actionMessage: PropTypes.object,
		toggleReactionPicker: PropTypes.func.isRequired,
		actionsShow: PropTypes.func
	};

	static navigationOptions = ({ navigation }) => ({
		header: <Header subview={<RoomsHeader navigation={navigation} />} />
	});

	constructor(props) {
		super('RoomView', props);
		this.rid =
			props.rid ||
			props.navigation.state.params.room.rid;
		this.name = props.name ||
			props.navigation.state.params.name ||
			props.navigation.state.params.room.name;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			loaded: true,
			joined: typeof props.rid === 'undefined',
			room: JSON.parse(JSON.stringify(this.rooms[0]))
		};
		this.onReactionPress = this.onReactionPress.bind(this);
	}

	async componentDidMount() {
		this.props.navigation.setParams({
			title: this.name
		});
		await this.props.openRoom({
			...this.state.room
		});
		if (this.state.room.alert || this.state.room.unread || this.state.room.userMentions) {
			this.props.setLastOpen(this.state.room.ls);
		} else {
			this.props.setLastOpen(null);
		}

		this.rooms.addListener(this.updateRoom);
	}
	shouldComponentUpdate(nextProps, nextState) {
		return !(equal(this.props, nextProps) && equal(this.state, nextState) && this.state.room.ro === nextState.room.ro);
	}
	componentWillUnmount() {
		this.rooms.removeAllListeners();
		this.props.editCancel();
	}

	onEndReached = (data) => {
		if (this.props.loading || this.state.end) {
			return;
		}

		requestAnimationFrame(() => {
			const lastRowData = data[data.length - 1];
			if (!lastRowData) {
				return;
			}
			// TODO: fix
			RocketChat.loadMessagesForRoom({ rid: this.rid, t: this.state.room.t, latest: lastRowData.ts }, ({ end }) => end && this.setState({
				end
			}));
		});
	}

	onMessageLongPress = (message) => {
		this.props.actionsShow(message);
	}

	onReactionPress = (shortname, messageId) => {
		if (!messageId) {
			RocketChat.setReaction(shortname, this.props.actionMessage._id);
			return this.props.toggleReactionPicker();
		}
		RocketChat.setReaction(shortname, messageId);
	};

	updateRoom = () => {
		this.setState({ room: JSON.parse(JSON.stringify(this.rooms[0])) });
	}

	sendMessage = (message) => {
		RocketChat.sendMessage(this.rid, message).then(() => {
			this.props.setLastOpen(null);
		});
	};

	joinRoom = async() => {
		await RocketChat.joinRoom(this.props.rid);
		this.setState({
			joined: true
		});
	};

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
			previousItem={previousItem}
		/>
	);

	// renderSeparator = () => <View style={styles.separator} />;

	renderFooter = () => {
		if (!this.state.joined) {
			return (
				<View>
					<Text>You are in preview mode.</Text>
					<Button title='Join' onPress={this.joinRoom} />
				</View>
			);
		}
		if (this.state.room.ro || this.state.room.archived) {
			return (
				<View style={styles.readOnly}>
					<Text>This room is read only</Text>
				</View>
			);
		}
		return <MessageBox onSubmit={this.sendMessage} rid={this.rid} />;
	};

	renderHeader = () => {
		if (this.state.end) {
			return <Text style={styles.loadingMore}>Start of conversation</Text>;
		}
		return <Text style={styles.loadingMore}>Loading more messages...</Text>;
	}
	render() {
		return (
			<View style={styles.container}>
				<List
					key='room-view-messages'
					end={this.state.end}
					room={this.rid}
					renderFooter={this.renderHeader}
					onEndReached={this.onEndReached}
					renderRow={this.renderItem}
				/>
				{this.renderFooter()}
				{this.state.room._id ? <MessageActions room={this.state.room} /> : null}
				<MessageErrorActions />
				<ReactionPicker onEmojiSelected={this.onReactionPress} />
			</View>
		);
	}
}
