import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, Button, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import equal from 'deep-equal';

import { ListView } from './ListView';
import * as actions from '../../actions';
import { openRoom, setLastOpen } from '../../actions/room';
import { editCancel } from '../../actions/messages';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import Typing from '../../containers/Typing';
import KeyboardView from '../../presentation/KeyboardView';
import Header from '../../containers/Header';
import RoomsHeader from './Header';
import Banner from './banner';
import styles from './styles';

import debounce from '../../utils/debounce';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1._id !== r2._id });

const typing = () => <Typing />;
@connect(
	state => ({
		Site_Url: state.settings.Site_Url || state.server ? state.server.server : '',
		Message_TimeFormat: state.settings.Message_TimeFormat,
		loading: state.messages.isFetching,
		user: state.login.user
	}),
	dispatch => ({
		actions: bindActionCreators(actions, dispatch),
		openRoom: room => dispatch(openRoom(room)),
		editCancel: () => dispatch(editCancel()),
		setLastOpen: date => dispatch(setLastOpen(date))
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
		Message_TimeFormat: PropTypes.string
	};

	static navigationOptions = ({ navigation }) => ({
		header: <Header subview={<RoomsHeader navigation={navigation} />} />
	});

	constructor(props) {
		super(props);
		this.rid =
			props.rid ||
			props.navigation.state.params.room.rid;
		this.name = this.props.name ||
		this.props.navigation.state.params.name ||
		this.props.navigation.state.params.room.name;
		this.opened = new Date();
		this.data = database
			.objects('messages')
			.filtered('rid = $0', this.rid)
			.sorted('ts', true);
		const rowIds = this.data.map((row, index) => index);
		this.rooms = database.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			dataSource: ds.cloneWithRows(this.data, rowIds),
			loaded: true,
			joined: typeof props.rid === 'undefined',
			readOnly: false
		};
	}

	componentWillMount() {
		this.props.navigation.setParams({
			title: this.name
		});
		this.updateRoom();
		this.props.openRoom({ rid: this.rid, name: this.name, ls: this.room.ls });
		if (this.room.alert || this.room.unread || this.room.userMentions) {
			this.props.setLastOpen(this.room.ls);
		} else {
			this.props.setLastOpen(null);
		}
		this.data.addListener(this.updateState);
		this.rooms.addListener(this.updateRoom);
	}
	shouldComponentUpdate(nextProps, nextState) {
		return !(equal(this.props, nextProps) && equal(this.state, nextState));
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		this.data.removeAllListeners();
		this.props.editCancel();
	}

	onEndReached = () => {
		if (
			// rowCount &&
			this.state.loaded &&
			this.state.loadingMore !== true &&
			this.state.end !== true
		) {
			this.setState({
				loadingMore: true
			});
			requestAnimationFrame(() => {
				const lastRowData = this.data[this.data.length - 1];
				if (!lastRowData) {
					return;
				}
				RocketChat.loadMessagesForRoom(this.rid, lastRowData.ts, ({ end }) => {
					this.setState({
						loadingMore: false,
						end
					});
				});
			});
		}
	}

	updateState = debounce(() => {
		const rowIds = this.data.map((row, index) => index);
		this.setState({
			dataSource: this.state.dataSource.cloneWithRows(this.data, rowIds)
		});
	}, 50);

	updateRoom = () => {
		[this.room] = this.rooms;
		this.setState({ readOnly: this.room.ro });
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
			animate={this.opened.toISOString() < item.ts.toISOString()}
			baseUrl={this.props.Site_Url}
			Message_TimeFormat={this.props.Message_TimeFormat}
			user={this.props.user}
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
		if (this.state.readOnly) {
			return (
				<View style={styles.readOnly}>
					<Text>This room is read only</Text>
				</View>
			);
		}
		return <MessageBox ref={box => (this.box = box)} onSubmit={this.sendMessage} rid={this.rid} />;
	};

	renderHeader = () => {
		if (this.state.loadingMore) {
			return <Text style={styles.loadingMore}>Loading more messages...</Text>;
		}

		if (this.state.end) {
			return <Text style={styles.loadingMore}>Start of conversation</Text>;
		}
	}
	render() {
		return (
			<KeyboardView contentContainerStyle={styles.container} keyboardVerticalOffset={64}>

				<Banner />
				<SafeAreaView style={styles.safeAreaView}>
					<ListView
						enableEmptySections
						style={styles.list}
						onEndReachedThreshold={500}
						renderFooter={this.renderHeader}
						renderHeader={typing}
						onEndReached={this.onEndReached}
						dataSource={this.state.dataSource}
						renderRow={item => this.renderItem(item)}
						initialListSize={10}
						{...scrollPersistTaps}
					/>
				</SafeAreaView>
				{this.renderFooter()}
				<MessageActions room={this.room} />
				<MessageErrorActions />
			</KeyboardView>
		);
	}
}
