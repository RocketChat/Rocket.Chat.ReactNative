import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Vibration } from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import SafeAreaView from 'react-native-safe-area-view';
import equal from 'deep-equal';

import LoggedView from '../View';
import styles from './styles';
import UserItem from '../../presentation/UserItem';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/realm';
import { showToast } from '../../utils/info';
import log from '../../utils/log';
import { isAndroid } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	room: state.room
}))
/** @extends React.Component */
export default class RoomMembersView extends LoggedView {
	static options() {
		return {
			topBar: {
				title: {
					text: I18n.t('Members')
				},
				rightButtons: [{
					id: 'toggleOnline',
					text: I18n.t('Online'),
					testID: 'room-members-view-toggle-status',
					color: isAndroid ? '#FFF' : undefined
				}]
			}
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		rid: PropTypes.string,
		members: PropTypes.array,
		baseUrl: PropTypes.string,
		room: PropTypes.object
	}

	constructor(props) {
		super('MentionedMessagesView', props);

		this.CANCEL_INDEX = 0;
		this.MUTE_INDEX = 1;
		this.actionSheetOptions = [''];
		const { rid, members, room } = props;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.permissions = RocketChat.hasPermission(['mute-user'], rid);
		this.state = {
			allUsers: false,
			filtering: false,
			rid,
			members,
			membersFiltered: [],
			userLongPressed: {},
			room,
			options: []
		};
		Navigation.events().bindComponent(this);
	}

	componentDidMount() {
		this.fetchMembers();
		this.rooms.addListener(this.updateRoom);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			allUsers, filtering, members, membersFiltered, userLongPressed, room, options
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
		return false;
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	navigationButtonPressed = ({ buttonId }) => {
		const { allUsers } = this.state;
		const { componentId } = this.props;

		if (buttonId === 'toggleOnline') {
			try {
				Navigation.mergeOptions(componentId, {
					topBar: {
						rightButtons: [{
							id: 'toggleOnline',
							text: allUsers ? I18n.t('Online') : I18n.t('All'),
							testID: 'room-members-view-toggle-status',
							color: isAndroid ? '#FFF' : undefined
						}]
					}
				});
				this.fetchMembers(!allUsers);
			} catch (e) {
				log('RoomMembers.onNavigationButtonPressed', e);
			}
		}
	}

	onSearchChangeText = (text) => {
		const { members } = this.state;

		let membersFiltered = [];
		if (text) {
			membersFiltered = members.filter(m => m.username.toLowerCase().match(text.toLowerCase()));
		}
		this.setState({ filtering: !!text, membersFiltered });
	}

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
			log('onPressUser', e);
		}
	}

	onLongPressUser = (user) => {
		if (!this.permissions['mute-user']) {
			return;
		}
		try {
			const { room } = this.state;
			const { muted } = room;

			const options = [I18n.t('Cancel')];
			const userIsMuted = !!muted.find(m => m.value === user.username);
			user.muted = userIsMuted;
			if (userIsMuted) {
				options.push(I18n.t('Unmute'));
			} else {
				options.push(I18n.t('Mute'));
			}
			this.setState({ userLongPressed: user, options });
			Vibration.vibrate(50);
			if (this.actionSheet && this.actionSheet.show) {
				this.actionSheet.show();
			}
		} catch (error) {
			console.log('onLongPressUser -> catch -> error', error);
		}
	}

	fetchMembers = async(status) => {
		const { rid } = this.state;
		const membersResult = await RocketChat.getRoomMembers(rid, status);
		const members = membersResult.records;
		this.setState({ allUsers: status, members });
	}

	updateRoom = () => {
		if (this.rooms.length > 0) {
			const [room] = this.rooms;
			this.setState({ room });
		}
	}

	goRoom = async({ rid, name }) => {
		const { componentId } = this.props;
		await Navigation.popToRoot(componentId);
		Navigation.push('RoomsListView', {
			component: {
				name: 'RoomView',
				passProps: {
					rid, name, t: 'd'
				}
			}
		});
	}

	handleMute = async() => {
		const { rid, userLongPressed } = this.state;
		try {
			await RocketChat.toggleMuteUserInRoom(rid, userLongPressed.username, !userLongPressed.muted);
			showToast(I18n.t('User_has_been_key', { key: userLongPressed.muted ? I18n.t('unmuted') : I18n.t('muted') }));
		} catch (e) {
			log('handleMute', e);
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
		const { baseUrl } = this.props;

		return (
			<UserItem
				name={item.name}
				username={item.username}
				onPress={() => this.onPressUser(item)}
				onLongPress={() => this.onLongPressUser(item)}
				baseUrl={baseUrl}
				testID={`room-members-view-item-${ item.username }`}
			/>
		);
	}

	render() {
		const {
			filtering, members, membersFiltered, options
		} = this.state;
		return (
			<SafeAreaView style={styles.list} testID='room-members-view' forceInset={{ bottom: 'never' }}>
				<FlatList
					data={filtering ? membersFiltered : members}
					renderItem={this.renderItem}
					style={styles.list}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={this.renderSeparator}
					ListHeaderComponent={this.renderSearchBar}
					{...scrollPersistTaps}
				/>
				<ActionSheet
					ref={o => this.actionSheet = o}
					title={I18n.t('Actions')}
					options={options}
					cancelButtonIndex={this.CANCEL_INDEX}
					onPress={this.handleActionPress}
				/>
			</SafeAreaView>
		);
	}
}
