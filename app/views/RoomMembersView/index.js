import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View } from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import * as Haptics from 'expo-haptics';
import { Q } from '@nozbe/watermelondb';

import styles from './styles';
import UserItem from '../../presentation/UserItem';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import log from '../../utils/log';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import { CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { withTheme } from '../../theme';
import { themedHeader } from '../../utils/navigation';
import { themes } from '../../constants/colors';
import { getUserSelector } from '../../selectors/login';

const PAGE_SIZE = 25;

class RoomMembersView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const toggleStatus = navigation.getParam('toggleStatus', () => {});
		const allUsers = navigation.getParam('allUsers');
		const toggleText = allUsers ? I18n.t('Online') : I18n.t('All');
		return {
			title: I18n.t('Members'),
			...themedHeader(screenProps.theme),
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
		}),
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.CANCEL_INDEX = 0;
		this.MUTE_INDEX = 1;
		this.actionSheetOptions = [''];
		const { rid } = props.navigation.state.params;
		const room = props.navigation.getParam('room');
		this.state = {
			isLoading: false,
			allUsers: false,
			filtering: false,
			rid,
			members: [],
			membersFiltered: [],
			userLongPressed: {},
			room: room || {},
			end: false
		};
		if (room && room.observe) {
			this.roomObservable = room.observe();
			this.subscription = this.roomObservable
				.subscribe((changes) => {
					if (this.mounted) {
						this.setState({ room: changes });
					} else {
						this.state.room = changes;
					}
				});
		}
	}

	async componentDidMount() {
		this.mounted = true;
		this.fetchMembers();

		const { navigation } = this.props;
		const { rid } = navigation.state.params;
		navigation.setParams({ toggleStatus: this.toggleStatus });
		this.permissions = await RocketChat.hasPermission(['mute-user'], rid);
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
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
			const db = database.active;
			const subsCollection = db.collections.get('subscriptions');
			const query = await subsCollection.query(Q.where('name', item.username)).fetch();
			if (query.length) {
				const [room] = query;
				this.goRoom({ rid: room.rid, name: item.username, room });
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
		const userIsMuted = !!(muted || []).find(m => m === user.username);
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

	goRoom = async({ rid, name, room }) => {
		const { navigation } = this.props;
		await navigation.popToTop();
		navigation.navigate('RoomView', {
			rid, name, t: 'd', room
		});
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

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
	}

	renderItem = ({ item }) => {
		const { baseUrl, user, theme } = this.props;

		return (
			<UserItem
				name={item.name}
				username={item.username}
				onPress={() => this.onPressUser(item)}
				onLongPress={() => this.onLongPressUser(item)}
				baseUrl={baseUrl}
				testID={`room-members-view-item-${ item.username }`}
				user={user}
				theme={theme}
			/>
		);
	}

	render() {
		const {
			filtering, members, membersFiltered, isLoading
		} = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView style={styles.list} testID='room-members-view' forceInset={{ vertical: 'never' }}>
				<StatusBar theme={theme} />
				<FlatList
					data={filtering ? membersFiltered : members}
					renderItem={this.renderItem}
					style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={this.renderSeparator}
					ListHeaderComponent={this.renderSearchBar}
					ListFooterComponent={() => {
						if (isLoading) {
							return <ActivityIndicator theme={theme} />;
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
	baseUrl: state.server.server,
	user: getUserSelector(state)
});

export default connect(mapStateToProps)(withTheme(RoomMembersView));
