import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, Button, SafeAreaView, Platform, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import equal from 'deep-equal';
import KeyboardSpacer from 'react-native-keyboard-spacer';

import { List } from './ListView';
import * as actions from '../../actions';
import { openRoom, setLastOpen } from '../../actions/room';
import { editCancel, toggleReactionPicker } from '../../actions/messages';
import { setKeyboardOpen, setKeyboardClosed } from '../../actions/keyboard';
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
		actionMessage: state.messages.actionMessage
	}),
	dispatch => ({
		actions: bindActionCreators(actions, dispatch),
		openRoom: room => dispatch(openRoom(room)),
		editCancel: () => dispatch(editCancel()),
		setLastOpen: date => dispatch(setLastOpen(date)),
		toggleReactionPicker: message => dispatch(toggleReactionPicker(message)),
		setKeyboardOpen: () => dispatch(setKeyboardOpen()),
		setKeyboardClosed: () => dispatch(setKeyboardClosed())
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
		setKeyboardOpen: PropTypes.func,
		setKeyboardClosed: PropTypes.func
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
		this.opened = new Date();
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			loaded: true,
			joined: typeof props.rid === 'undefined',
			room: {}
		};
		this.onReactionPress = this.onReactionPress.bind(this);
	}

	componentWillMount() {
		this.props.navigation.setParams({
			title: this.name
		});
		this.updateRoom();
		this.props.openRoom({ rid: this.rid, name: this.name, ls: this.state.room.ls });
		if (this.state.room.alert || this.state.room.unread || this.state.room.userMentions) {
			this.props.setLastOpen(this.state.room.ls);
		} else {
			this.props.setLastOpen(null);
		}

		this.rooms.addListener(this.updateRoom);
		this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => this.props.setKeyboardOpen());
		this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => this.props.setKeyboardClosed());
	}
	shouldComponentUpdate(nextProps, nextState) {
		return !(equal(this.props, nextProps) && equal(this.state, nextState));
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		this.rooms.removeAllListeners();
		this.keyboardDidShowListener.remove();
		this.keyboardDidHideListener.remove();
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

	sendMessage = message => RocketChat.sendMessage(this.rid, message).then(() => {
		this.props.setLastOpen(null);
	});

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
			animate={this.opened.toISOString() < item.ts.toISOString()}
			baseUrl={this.props.Site_Url}
			Message_TimeFormat={this.props.Message_TimeFormat}
			user={this.props.user}
			onReactionPress={this.onReactionPress}
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
				<SafeAreaView style={styles.safeAreaView}>
					<List
						end={this.state.end}
						room={this.rid}
						renderFooter={this.renderHeader}
						onEndReached={this.onEndReached}
						renderRow={item => this.renderItem(item)}
					/>
				</SafeAreaView>
				{this.renderFooter()}
				{this.state.room._id ? <MessageActions room={this.state.room} /> : null}
				<MessageErrorActions />
				<ReactionPicker onEmojiSelected={this.onReactionPress} />
				{Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
			</View>
		);
	}
}
