import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, View } from 'react-native';
import { connect } from 'react-redux';
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
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { getUserSelector } from '../../selectors/login';
import { withActionSheet } from '../../containers/ActionSheet';
import { showConfirmationAlert } from '../../utils/info';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom } from '../../utils/goRoom';

const PAGE_SIZE = 25;

class RoomMembersView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		rid: PropTypes.string,
		members: PropTypes.array,
		baseUrl: PropTypes.string,
		room: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		showActionSheet: PropTypes.func,
		theme: PropTypes.string,
		isMasterDetail: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.MUTE_INDEX = 0;
		const rid = props.route.params?.rid;
		const room = props.route.params?.room;
		this.state = {
			isLoading: false,
			allUsers: false,
			filtering: false,
			rid,
			members: [],
			membersFiltered: [],
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
		this.setHeader();
	}

	async componentDidMount() {
		this.mounted = true;
		this.fetchMembers();

		const { route } = this.props;
		const rid = route.params?.rid;
		this.permissions = await RocketChat.hasPermission(['mute-user'], rid);
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	setHeader = () => {
		const { allUsers } = this.state;
		const { navigation } = this.props;
		const toggleText = allUsers ? I18n.t('Online') : I18n.t('All');
		navigation.setOptions({
			title: I18n.t('Members'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item title={toggleText} onPress={this.toggleStatus} testID='room-members-view-toggle-status' />
				</HeaderButton.Container>
			)
		});
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
				this.goRoom(room);
			} else {
				const result = await RocketChat.createDirectMessage(item.username);
				if (result.success) {
					this.goRoom({ rid: result.room?._id, name: item.username, t: 'd' });
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
		const { showActionSheet } = this.props;
		const { muted } = room;

		const userIsMuted = !!(muted || []).find(m => m === user.username);
		user.muted = userIsMuted;

		showActionSheet({
			options: [{
				icon: userIsMuted ? 'audio' : 'audio-disabled',
				title: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
				onPress: () => {
					showConfirmationAlert({
						message: I18n.t(`The_user_${ userIsMuted ? 'will' : 'wont' }_be_able_to_type_in_roomName`, {
							roomName: RocketChat.getRoomTitle(room)
						}),
						confirmationText: I18n.t(userIsMuted ? 'Unmute' : 'Mute'),
						onPress: () => this.handleMute(user)
					});
				}
			}],
			hasCancel: true
		});
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

	// eslint-disable-next-line react/sort-comp
	fetchMembers = async() => {
		const {
			rid, members, isLoading, allUsers, end
		} = this.state;
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
			this.setHeader();
		} catch (e) {
			log(e);
			this.setState({ isLoading: false });
		}
	}

	goRoom = (item) => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.popToTop();
		}
		goRoom({ item, isMasterDetail });
	}

	handleMute = async(user) => {
		const { rid } = this.state;
		try {
			await RocketChat.toggleMuteUserInRoom(rid, user?.username, !user?.muted);
			EventEmitter.emit(LISTENER, { message: I18n.t('User_has_been_key', { key: user?.muted ? I18n.t('unmuted') : I18n.t('muted') }) });
		} catch (e) {
			log(e);
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
			<SafeAreaView testID='room-members-view'>
				<StatusBar />
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
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withActionSheet(withTheme(RoomMembersView)));
