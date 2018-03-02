import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, Button } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import equal from 'deep-equal';

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
import Banner from './banner';
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
export default class RoomView extends React.Component {
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
		// layoutAnimation: PropTypes.instanceOf(Date),
		actionsShow: PropTypes.func
	};

	static navigationOptions = ({ navigation }) => ({
		header: <Header subview={<RoomsHeader navigation={navigation} />} />
	});

	constructor(props) {
		super(props);
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
			room: {}
		};
		this.onReactionPress = this.onReactionPress.bind(this);
	}

	async componentDidMount() {
		this.props.navigation.setParams({
			title: this.name
		});
		this.updateRoom();
		await this.props.openRoom({ rid: this.rid, name: this.name, ls: this.state.room.ls });
		if (this.state.room.alert || this.state.room.unread || this.state.room.userMentions) {
			this.props.setLastOpen(this.state.room.ls);
		} else {
			this.props.setLastOpen(null);
		}

		this.rooms.addListener(this.updateRoom);
	}
	// componentWillReceiveProps(nextProps) {
	// 	// if (this.props.layoutAnimation !== nextProps.layoutAnimation) {
	// 	// 	LayoutAnimation.spring();
	// 	// }
	// }
	shouldComponentUpdate(nextProps, nextState) {
		return !(equal(this.props, nextProps) && equal(this.state, nextState));
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		this.rooms.removeAllListeners();
		this.props.editCancel();
	}

	onEndReached = (data) => {
		if (this.props.loading || this.state.end) {
			return;
		}
		if (!this.state.loaded) {
			alert(2);
			return;
		}

		requestAnimationFrame(() => {
			const lastRowData = data[data.length - 1];
			if (!lastRowData) {
				return;
			}
			RocketChat.loadMessagesForRoom(this.rid, lastRowData.ts, ({ end }) => end && this.setState({
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
		this.setState({ room: this.rooms[0] });
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

	renderItem = item => (
		<Message
			key={item._id}
			item={item}
			reactions={JSON.parse(JSON.stringify(item.reactions))}
			baseUrl={this.props.Site_Url}
			Message_TimeFormat={this.props.Message_TimeFormat}
			user={this.props.user}
			onReactionPress={this.onReactionPress}
			onLongPress={this.onMessageLongPress}
		/>
	);

	renderSeparator = () => <View style={styles.separator} />;

	renderFooter = () => {
		if (!this.state.joined) {
			return (
				<View>
					<Text>You are in preview mode.</Text>
					<Button title='Join' onPress={this.joinRoom} />
				</View>
			);
		}
		if (this.state.room.ro) {
			return (
				<View style={styles.readOnly}>
					<Text>This room is read only</Text>
				</View>
			);
		}
		return <MessageBox ref={box => (this.box = box)} onSubmit={this.sendMessage} rid={this.rid} />;
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
				<Banner />
				<List
					key='room-view-messages'
					end={this.state.end}
					room={this.rid}
					renderFooter={this.renderHeader}
					onEndReached={this.onEndReached}
					renderRow={item => this.renderItem(item)}
				/>
				{this.renderFooter()}
				{this.state.room._id ? <MessageActions room={this.state.room} /> : null}
				<MessageErrorActions />
				<ReactionPicker onEmojiSelected={this.onReactionPress} />
			</View>
		);
	}
}
