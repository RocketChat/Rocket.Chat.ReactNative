import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, Button, SafeAreaView } from 'react-native';
import { ListView } from 'realm/react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as actions from '../../actions';
import { openRoom } from '../../actions/room';
import { editCancel } from '../../actions/messages';
import realm from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import Typing from '../../containers/Typing';
import KeyboardView from '../../presentation/KeyboardView';
import Header from '../../containers/Header';
import RoomsHeader from './Header';
import styles from './styles';

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1._id !== r2._id });

const typing = () => <Typing />;
@connect(
	state => ({
		server: state.server.server,
		Site_Url: state.settings.Site_Url,
		Message_TimeFormat: state.settings.Message_TimeFormat,
		loading: state.messages.isFetching,
		user: state.login.user
	}),
	dispatch => ({
		actions: bindActionCreators(actions, dispatch),
		openRoom: room => dispatch(openRoom(room)),
		editCancel: () => dispatch(editCancel())
	})
)
export default class RoomView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		openRoom: PropTypes.func.isRequired,
		user: PropTypes.object.isRequired,
		editCancel: PropTypes.func,
		rid: PropTypes.string,
		server: PropTypes.string,
		name: PropTypes.string,
		Site_Url: PropTypes.string,
		Message_TimeFormat: PropTypes.string,
		loading: PropTypes.bool
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

		this.data = realm
			.objects('messages')
			.filtered('_server.id = $0 AND rid = $1', this.props.server, this.rid)
			.sorted('ts', true);
		this.room = realm.objects('subscriptions').filtered('rid = $0', this.rid);
		this.state = {
			dataSource: ds.cloneWithRows([]),
			loaded: true,
			joined: typeof props.rid === 'undefined'
		};
	}

	componentWillMount() {
		this.props.navigation.setParams({
			title: this.name
		});
		this.props.openRoom({ rid: this.rid, name: this.name });
		this.data.addListener(this.updateState);
	}
	componentDidMount() {
		this.updateState();
	}
	componentWillUnmount() {
		clearTimeout(this.timer);
		this.data.removeAllListeners();
		this.props.editCancel();
	}

	onEndReached = () => {
		const rowCount = this.state.dataSource.getRowCount();
		if (
			rowCount &&
			this.state.loaded &&
			this.state.loadingMore !== true &&
			this.state.end !== true
		) {
			this.setState({
				loadingMore: true
			});

			const lastRowData = this.data[rowCount - 1];
			RocketChat.loadMessagesForRoom(this.rid, lastRowData.ts, ({ end }) => {
				this.setState({
					loadingMore: false,
					end
				});
			});
		}
	}

	updateState = () => {
		this.setState({
			dataSource: ds.cloneWithRows(this.data)
		});
	};

	sendMessage = message => RocketChat.sendMessage(this.rid, message);

	joinRoom = async() => {
		await RocketChat.joinRoom(this.props.rid);
		this.setState({
			joined: true
		});
	};

	renderBanner = () =>
		(this.props.loading ? (
			<View style={styles.bannerContainer}>
				<Text style={styles.bannerText}>Loading new messages...</Text>
			</View>
		) : null);

	renderItem = ({ item }) => (
		<Message
			key={item._id}
			item={item}
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
				{this.renderBanner()}
				<SafeAreaView style={styles.safeAreaView}>
					<ListView
						enableEmptySections
						style={styles.list}
						onEndReachedThreshold={0.5}
						renderFooter={this.renderHeader}
						renderHeader={typing}
						onEndReached={this.onEndReached}
						dataSource={this.state.dataSource}
						renderRow={item => this.renderItem({ item })}
						initialListSize={10}
						keyboardShouldPersistTaps='always'
						keyboardDismissMode='interactive'
					/>
				</SafeAreaView>
				{this.renderFooter()}
				<MessageActions room={this.room} />
				<MessageErrorActions />
			</KeyboardView>
		);
	}
}
