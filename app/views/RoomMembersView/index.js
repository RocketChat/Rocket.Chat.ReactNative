import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Vibration, SafeAreaView } from 'react-native';
import ActionSheet from 'react-native-actionsheet';

import LoggedView from '../View';
import styles from './styles';
import UserItem from '../../presentation/UserItem';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/realm';
import { showToast } from '../../utils/info';
import log from '../../utils/log';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';

/** @extends React.Component */
export default class RoomMembersView extends LoggedView {
	static navigatorButtons = {
		rightButtons: [{
			title: 'All',
			id: 'toggleOnline',
			testID: 'room-members-view-toggle-status'
		}]
	};

	static propTypes = {
		navigator: PropTypes.object,
		rid: PropTypes.string,
		members: PropTypes.array
	}

	constructor(props) {
		super('MentionedMessagesView', props);
		this.CANCEL_INDEX = 0;
		this.MUTE_INDEX = 1;
		this.actionSheetOptions = [''];
		const { rid, members } = props;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.permissions = RocketChat.hasPermission(['mute-user'], rid);
		this.state = {
			allUsers: false,
			filtering: false,
			rid,
			members,
			membersFiltered: [],
			userLongPressed: {},
			room: {}
		};
		this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentDidMount() {
		this.rooms.addListener(this.updateRoom);
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	async onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'toggleOnline') {
				try {
					const allUsers = !this.state.allUsers;
					const membersResult = await RocketChat.getRoomMembers(this.state.rid, allUsers);
					const members = membersResult.records;
					this.setState({ allUsers, members });
					this.props.navigator.setButtons({
						rightButtons: [{
							title: this.state.allUsers ? 'Online' : 'All',
							id: 'toggleOnline',
							testID: 'room-members-view-toggle-status'
						}]
					});
				} catch (e) {
					log('RoomMembers.onNavigationButtonPressed', e);
				}
			}
		}
	}

	onSearchChangeText = (text) => {
		let membersFiltered = [];
		if (text) {
			membersFiltered = this.state.members.filter(m => m.username.toLowerCase().match(text.toLowerCase()));
		}
		this.setState({ filtering: !!text, membersFiltered });
	}

	onPressUser = async(item) => {
		try {
			const subscriptions = database.objects('subscriptions').filtered('name = $0', item.username);
			if (subscriptions.length) {
				this.goRoom({ rid: subscriptions[0].rid, name: subscriptions[0].name });
			} else {
				const room = await RocketChat.createDirectMessage(item.username);
				this.goRoom({ rid: room.rid, name: item.username });
			}
		} catch (e) {
			log('onPressUser', e);
		}
	}

	onLongPressUser = (user) => {
		if (!this.permissions['mute-user']) {
			return;
		}
		this.actionSheetOptions = [I18n.t('Cancel')];
		const { muted } = this.state.room;
		const userIsMuted = !!muted.find(m => m.value === user.username);
		user.muted = userIsMuted;
		if (userIsMuted) {
			this.actionSheetOptions.push(I18n.t('Unmute'));
		} else {
			this.actionSheetOptions.push(I18n.t('Mute'));
		}
		this.setState({ userLongPressed: user });
		Vibration.vibrate(50);
		if (this.actionSheet && this.actionSheet.show) {
			this.actionSheet.show();
		}
	}

	updateRoom = async() => {
		const [room] = this.rooms;
		await this.setState({ room });
	}

	goRoom = ({ rid, name }) => {
		this.props.navigator.popToRoot();
		setTimeout(() => {
			this.props.navigator.push({
				screen: 'RoomView',
				title: name,
				backButtonTitle: '',
				passProps: {
					room: { rid, name },
					rid,
					name
				}
			});
		}, 1000);
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

	renderItem = ({ item }) => (
		<UserItem
			name={item.name}
			username={item.username}
			onPress={() => this.onPressUser(item)}
			onLongPress={() => this.onLongPressUser(item)}
			testID={`room-members-view-item-${ item.username }`}
		/>
	)

	render() {
		const { filtering, members, membersFiltered } = this.state;
		return (
			<SafeAreaView style={styles.list} testID='room-members-view'>
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
					options={this.actionSheetOptions}
					cancelButtonIndex={this.CANCEL_INDEX}
					onPress={this.handleActionPress}
				/>
			</SafeAreaView>
		);
	}
}
