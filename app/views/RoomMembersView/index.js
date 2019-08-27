import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, ActivityIndicator } from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import * as Haptics from 'expo-haptics';

import styles from './styles';
import UserItem from '../../presentation/UserItem';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import database, { safeAddListener } from '../../lib/realm';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import log from '../../utils/log';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import { CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';

const PAGE_SIZE = 25;

class RoomMembersView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const toggleStatus = navigation.getParam('toggleStatus', () => {});
		const allUsers = navigation.getParam('allUsers');
		const toggleText = allUsers ? I18n.t('Online') : I18n.t('All');
		return {
			title: I18n.t('Members'),
			headerRight: (
				<CustomHeaderButtons>
					<Item title={toggleText} onPress={toggleStatus} testID='room-members-view-toggle-status' />
				</CustomHeaderButtons>
			)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		rid: PropTypes.string,
		members: PropTypes.array,
		baseUrl: PropTypes.string,
		room: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		})
	}

	constructor(props) {
		super(props);

		this.CANCEL_INDEX = 0;
		this.MUTE_INDEX = 1;
		this.actionSheetOptions = [''];
		const { rid } = props.navigation.state.params;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.permissions = RocketChat.hasPermission(['mute-user'], rid);
		this.state = {
			isLoading: false,
			allUsers: false,
			filtering: false,
			rid,
			members: [],
			membersFiltered: [],
			userLongPressed: {},
			room: this.rooms[0] || {},
			options: [],
			end: false
		};
	}

	componentDidMount() {
		this.fetchMembers();
		safeAddListener(this.rooms, this.updateRoom);

		const { navigation } = this.props;
		navigation.setParams({ toggleStatus: this.toggleStatus });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			allUsers, filtering, members, membersFiltered, userLongPressed, room, options, isLoading
		} = this.state;
		if (nextState.allUsers !== allUsers) {
			return true;
		}
		if (nextState.filtering !== filtering) {
			return true;
		}
		if (!equal(nextState.members, members)) {
			return true;
		}
		if (!equal(nextState.options, options)) {
			return true;
		}
		if (!equal(nextState.membersFiltered, membersFiltered)) {
			return true;
		}
		if (!equal(nextState.userLongPressed, userLongPressed)) {
			return true;
		}
		if (!equal(nextState.room.muted, room.muted)) {
			return true;
		}
		if (isLoading !== nextState.isLoading) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	onSearchChangeText = protectedFunction((text) => {
		const { members } = this.state;
		let membersFiltered = [];

		if (members && members.length > 0 && text) {
			membersFiltered = members.filter(m => m.username.toLowerCase().match(text.toLowerCase()));
		}
		this.setState({ filtering: !!text, membersFiltered });
	})

	onPressUser = async(item) => {
		try {
			const subscriptions = database.objects('subscriptions').filtered('name = $0', item.username);
			if (subscriptions.length) {
				this.goRoom({ rid: subscriptions[0].rid, name: item.username });
			} else {
				const result = await RocketChat.createDirectMessage(item.username);
				if (result.success) {
					this.goRoom({ rid: result.room._id, name: item.username });
				}
			}
		} catch (e) {
			log(e);
		}
	}

	onLongPressUser = (user) => {
		if (!this.permissions['mute-user']) {
			return;
		}
		const { room } = this.state;
		const { muted } = room;

		this.actionSheetOptions = [I18n.t('Cancel')];
		const userIsMuted = !!muted.find(m => m === user.username);
		user.muted = userIsMuted;
		if (userIsMuted) {
			this.actionSheetOptions.push(I18n.t('Unmute'));
		} else {
			this.actionSheetOptions.push(I18n.t('Mute'));
		}
		this.setState({ userLongPressed: user });
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		this.showActionSheet();
	}

	toggleStatus = () => {
		try {
			const { allUsers } = this.state;
			this.setState({ members: [], allUsers: !allUsers, end: false }, () => {
				this.fetchMembers();
			});
		} catch (e) {
			log(e);
		}
	}

	showActionSheet = () => {
		ActionSheet.showActionSheetWithOptions({
			options: this.actionSheetOptions,
			cancelButtonIndex: this.CANCEL_INDEX,
			title: I18n.t('Actions')
		}, (actionIndex) => {
			this.handleActionPress(actionIndex);
		});
	}

	// eslint-disable-next-line react/sort-comp
	fetchMembers = async() => {
		const {
			rid, members, isLoading, allUsers, end
		} = this.state;
		const { navigation } = this.props;
		if (isLoading || end) {
			return;
		}

		this.setState({ isLoading: true });
		try {
			const membersResult = await RocketChat.getRoomMembers(rid, allUsers, members.length, PAGE_SIZE);
			const newMembers = membersResult.records;
			this.setState({
				members: members.concat(newMembers || []),
				isLoading: false,
				end: newMembers.length < PAGE_SIZE
			});
			navigation.setParams({ allUsers });
		} catch (e) {
			log(e);
			this.setState({ isLoading: false });
		}
	}

	updateRoom = () => {
		if (this.rooms.length > 0) {
			const [room] = this.rooms;
			this.setState({ room });
		}
	}

	goRoom = async({ rid, name }) => {
		const { navigation } = this.props;
		await navigation.popToTop();
		navigation.navigate('RoomView', { rid, name, t: 'd' });
	}

	handleMute = async() => {
		const { rid, userLongPressed } = this.state;
		try {
			await RocketChat.toggleMuteUserInRoom(rid, userLongPressed.username, !userLongPressed.muted);
			EventEmitter.emit(LISTENER, { message: I18n.t('User_has_been_key', { key: userLongPressed.muted ? I18n.t('unmuted') : I18n.t('muted') }) });
		} catch (e) {
			log(e);
		}
	}

	handleActionPress = (actionIndex) => {
		switch (actionIndex) {
			case this.MUTE_INDEX:
				this.handleMute();
				break;
			default:
				break;
		}
	}

	renderSearchBar = () => (
		<SearchBox onChangeText={text => this.onSearchChangeText(text)} testID='room-members-view-search' />
	)

	renderSeparator = () => <View style={styles.separator} />;

	renderItem = ({ item }) => {
		const { baseUrl, user } = this.props;

		return (
			<UserItem
				name={item.name}
				username={item.username}
				onPress={() => this.onPressUser(item)}
				onLongPress={() => this.onLongPressUser(item)}
				baseUrl={baseUrl}
				testID={`room-members-view-item-${ item.username }`}
				user={user}
			/>
		);
	}

	render() {
		const {
			filtering, members, membersFiltered, isLoading
		} = this.state;
		// if (isLoading) {
		// 	return <ActivityIndicator style={styles.loading} />;
		// }
		return (
			<SafeAreaView style={styles.list} testID='room-members-view' forceInset={{ vertical: 'never' }}>
				<StatusBar />
				<FlatList
					data={filtering ? membersFiltered : members}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={this.renderSeparator}
					ListHeaderComponent={this.renderSearchBar}
					ListFooterComponent={() => {
						if (isLoading) {
							return <ActivityIndicator style={styles.loading} />;
						}
						return null;
					}}
					onEndReachedThreshold={0.1}
					onEndReached={this.fetchMembers}
					maxToRenderPerBatch={5}
					windowSize={10}
					{...scrollPersistTaps}
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
});

export default connect(mapStateToProps)(RoomMembersView);
