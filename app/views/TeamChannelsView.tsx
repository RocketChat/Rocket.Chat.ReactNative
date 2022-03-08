import { Q } from '@nozbe/watermelondb';
import { HeaderBackButton, StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Alert, FlatList, Keyboard } from 'react-native';
import { EdgeInsets, withSafeAreaInsets } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { deleteRoom } from '../actions/room';
import { themes } from '../constants/colors';
import { withActionSheet } from '../containers/ActionSheet';
import ActivityIndicator from '../containers/ActivityIndicator';
import BackgroundContainer from '../containers/BackgroundContainer';
import { getHeaderTitlePosition } from '../containers/Header';
import * as HeaderButton from '../containers/HeaderButton';
import RoomHeader from '../containers/RoomHeader';
import SafeAreaView from '../containers/SafeAreaView';
import SearchHeader from '../containers/SearchHeader';
import StatusBar from '../containers/StatusBar';
import { IApplicationState, IBaseScreen } from '../definitions';
import { ERoomType } from '../definitions/ERoomType';
import { withDimensions } from '../dimensions';
import I18n from '../i18n';
import database from '../lib/database';
import { CustomIcon } from '../lib/Icons';
import RocketChat from '../lib/rocketchat';
import RoomItem, { ROW_HEIGHT } from '../presentation/RoomItem';
import { getUserSelector } from '../selectors/login';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';
import debounce from '../utils/debounce';
import { isIOS } from '../utils/deviceInfo';
import { goRoom } from '../utils/goRoom';
import { showErrorAlert } from '../utils/info';
import log, { events, logEvent } from '../utils/log';

const API_FETCH_COUNT = 25;
const PERMISSION_DELETE_C = 'delete-c';
const PERMISSION_DELETE_P = 'delete-p';
const PERMISSION_EDIT_TEAM_CHANNEL = 'edit-team-channel';
const PERMISSION_REMOVE_TEAM_CHANNEL = 'remove-team-channel';
const PERMISSION_ADD_TEAM_CHANNEL = 'add-team-channel';

const getItemLayout = (data: IItem[] | null | undefined, index: number) => ({
	length: data?.length || 0,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = (item: IItem) => item._id;

// This interface comes from request RocketChat.getTeamListRoom
interface IItem {
	_id: ERoomType;
	fname: string;
	customFields: object;
	broadcast: boolean;
	encrypted: boolean;
	name: string;
	t: string;
	msgs: number;
	usersCount: number;
	u: { _id: string; name: string };
	ts: string;
	ro: boolean;
	teamId: string;
	default: boolean;
	sysMes: boolean;
	_updatedAt: string;
	teamDefault: boolean;
}

interface ITeamChannelsViewState {
	loading: boolean;
	loadingMore: boolean;
	data: IItem[];
	isSearching: boolean;
	searchText: string | null;
	search: IItem[];
	end: boolean;
	showCreate: boolean;
}

type IProps = Omit<IBaseScreen<ChatsStackParamList, 'TeamChannelsView'>, 'navigation'> & {
	navigation: StackNavigationProp<any, 'TeamChannelsView'>;
};

interface ITeamChannelsViewProps extends IProps {
	isMasterDetail: boolean;
	insets: EdgeInsets;
	theme: string;
	useRealName: boolean;
	width: number;
	StoreLastMessage: boolean;
	addTeamChannelPermission: string[];
	editTeamChannelPermission: string[];
	removeTeamChannelPermission: string[];
	deleteCPermission: string[];
	deletePPermission: string[];
	showActionSheet: (options: any) => void;
	showAvatar: boolean;
	displayMode: string;
	dispatch: Dispatch;
}
class TeamChannelsView extends React.Component<ITeamChannelsViewProps, ITeamChannelsViewState> {
	private teamId: string;

	// TODO: Refactor when migrate room
	private teamChannels: any;

	// TODO: Refactor when migrate room
	private team: any;

	constructor(props: ITeamChannelsViewProps) {
		super(props);
		this.teamId = props.route.params?.teamId;
		this.state = {
			loading: true,
			loadingMore: false,
			data: [],
			isSearching: false,
			searchText: '',
			search: [],
			end: false,
			showCreate: false
		};
		this.loadTeam();
		this.setHeader();
	}

	componentDidMount() {
		this.load();
	}

	loadTeam = async () => {
		const { addTeamChannelPermission } = this.props;
		const { loading, data } = this.state;

		const db = database.active;
		try {
			const subCollection = db.get('subscriptions');
			this.teamChannels = await subCollection.query(Q.where('team_id', Q.eq(this.teamId)));
			this.team = this.teamChannels?.find((channel: any) => channel.teamMain);
			this.setHeader();

			if (!this.team) {
				throw new Error();
			}

			const permissions = await RocketChat.hasPermission([addTeamChannelPermission], this.team.rid);
			if (permissions[0]) {
				this.setState({ showCreate: true }, () => this.setHeader());
			}

			if (loading && data.length) {
				this.setState({ loading: false });
			}
		} catch {
			const { navigation } = this.props;
			navigation.pop();
			showErrorAlert(I18n.t('Team_not_found'));
		}
	};

	load = debounce(async () => {
		const { loadingMore, data, search, isSearching, searchText, end } = this.state;

		const length = isSearching ? search.length : data.length;
		if (loadingMore || end) {
			return;
		}

		this.setState({ loadingMore: true });
		try {
			const result = await RocketChat.getTeamListRoom({
				teamId: this.teamId,
				offset: length,
				count: API_FETCH_COUNT,
				type: 'all',
				filter: searchText
			});

			if (result.success) {
				const newState = {
					loading: false,
					loadingMore: false,
					end: result.rooms.length < API_FETCH_COUNT
				} as ITeamChannelsViewState;

				if (isSearching) {
					// @ts-ignore
					newState.search = [...search, ...result.rooms];
				} else {
					// @ts-ignore
					newState.data = [...data, ...result.rooms];
				}

				this.setState(newState);
			} else {
				this.setState({ loading: false, loadingMore: false });
			}
		} catch (e) {
			log(e);
			this.setState({ loading: false, loadingMore: false });
		}
	}, 300);

	setHeader = () => {
		const { isSearching, showCreate, data } = this.state;
		const { navigation, isMasterDetail, insets, theme } = this.props;

		const { team } = this;
		if (!team) {
			return;
		}

		const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 2 });

		if (isSearching) {
			const options: StackNavigationOptions = {
				headerTitleAlign: 'left',
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => (
					<SearchHeader onSearchChangeText={this.onSearchChangeText} testID='team-channels-view-search-header' />
				),
				headerTitleContainerStyle: {
					left: headerTitlePosition.left,
					right: headerTitlePosition.right
				},
				headerRight: () => null
			};
			return navigation.setOptions(options);
		}

		const options: StackNavigationOptions = {
			headerShown: true,
			headerTitleAlign: 'left',
			headerTitleContainerStyle: {
				left: headerTitlePosition.left,
				right: headerTitlePosition.right
			},
			headerLeft: () => (
				<HeaderBackButton labelVisible={false} onPress={() => navigation.pop()} tintColor={themes[theme].headerTintColor} />
			),
			headerTitle: () => (
				<RoomHeader
					title={RocketChat.getRoomTitle(team)}
					subtitle={team.topic}
					type={team.t}
					onPress={this.goRoomActionsView}
					teamMain
				/>
			)
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () => (
			<HeaderButton.Container>
				{showCreate ? (
					<HeaderButton.Item
						iconName='create'
						testID='team-channels-view-create'
						onPress={() => navigation.navigate('AddChannelTeamView', { teamId: this.teamId, teamChannels: data })}
					/>
				) : null}
				<HeaderButton.Item iconName='search' testID='team-channels-view-search' onPress={this.onSearchPress} />
			</HeaderButton.Container>
		);
		navigation.setOptions(options);
	};

	onSearchPress = () => {
		logEvent(events.TC_SEARCH);
		this.setState({ isSearching: true }, () => this.setHeader());
	};

	onSearchChangeText = debounce((searchText: string) => {
		this.setState(
			{
				searchText,
				search: [],
				loading: !!searchText,
				loadingMore: false,
				end: false
			},
			() => {
				if (searchText) {
					this.load();
				}
			}
		);
	}, 300);

	onCancelSearchPress = () => {
		logEvent(events.TC_CANCEL_SEARCH);
		const { isSearching } = this.state;
		if (!isSearching) {
			return;
		}
		Keyboard.dismiss();
		this.setState(
			{
				searchText: null,
				isSearching: false,
				search: [],
				loadingMore: false,
				end: false
			},
			() => {
				this.setHeader();
			}
		);
	};

	goRoomActionsView = (screen: string) => {
		logEvent(events.TC_GO_ACTIONS);
		const { team } = this;
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: team.rid,
					t: team.t,
					room: team,
					showCloseModal: false
				}
			});
		} else {
			navigation.navigate('RoomActionsView', {
				rid: team.rid,
				t: team.t,
				room: team
			});
		}
	};

	getRoomTitle = (item: IItem) => RocketChat.getRoomTitle(item);

	getRoomAvatar = (item: IItem) => RocketChat.getRoomAvatar(item);

	onPressItem = debounce(
		async (item: IItem) => {
			logEvent(events.TC_GO_ROOM);
			const { navigation, isMasterDetail } = this.props;
			try {
				const { room } = (await RocketChat.getRoomInfo(item._id)) as any;
				const params = {
					rid: item._id,
					name: RocketChat.getRoomTitle(room),
					joinCodeRequired: room.joinCodeRequired,
					t: room.t,
					teamId: room.teamId
				};
				if (isMasterDetail) {
					navigation.pop();
				}
				goRoom({ item: params, isMasterDetail, navigationMethod: navigation.push });
			} catch (e: any) {
				if (e.data.error === 'not-allowed') {
					showErrorAlert(I18n.t('error-not-allowed'));
				} else {
					showErrorAlert(e.data.error);
				}
			}
		},
		1000,
		true
	);

	toggleAutoJoin = async (item: IItem) => {
		logEvent(events.TC_TOGGLE_AUTOJOIN);
		try {
			const { data } = this.state;
			const result = await RocketChat.updateTeamRoom({ roomId: item._id, isDefault: !item.teamDefault });
			if (result.success) {
				const newData = data.map(i => {
					if (i._id === item._id) {
						i.teamDefault = !i.teamDefault;
					}
					return i;
				});
				this.setState({ data: newData });
			}
		} catch (e) {
			logEvent(events.TC_TOGGLE_AUTOJOIN_F);
			log(e);
		}
	};

	remove = (item: IItem) => {
		Alert.alert(
			I18n.t('Confirmation'),
			I18n.t('Remove_Team_Room_Warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('remove') }),
					style: 'destructive',
					onPress: () => this.removeRoom(item)
				}
			],
			{ cancelable: false }
		);
	};

	removeRoom = async (item: IItem) => {
		logEvent(events.TC_DELETE_ROOM);
		try {
			const { data } = this.state;
			const result = await RocketChat.removeTeamRoom({ roomId: item._id, teamId: this.team.teamId });
			if (result.success) {
				const newData = data.filter(room => result.room._id !== room._id);
				this.setState({ data: newData });
			}
		} catch (e) {
			logEvent(events.TC_DELETE_ROOM_F);
			log(e);
		}
	};

	delete = (item: IItem) => {
		logEvent(events.TC_DELETE_ROOM);
		const { dispatch } = this.props;

		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Delete_Room_Warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
					style: 'destructive',
					// VERIFY ON PR
					onPress: () => dispatch(deleteRoom(item._id, item))
				}
			],
			{ cancelable: false }
		);
	};

	showChannelActions = async (item: IItem) => {
		logEvent(events.ROOM_SHOW_BOX_ACTIONS);
		const {
			showActionSheet,
			editTeamChannelPermission,
			deleteCPermission,
			deletePPermission,
			theme,
			removeTeamChannelPermission
		} = this.props;
		const isAutoJoinChecked = item.teamDefault;
		const autoJoinIcon = isAutoJoinChecked ? 'checkbox-checked' : 'checkbox-unchecked';
		const autoJoinIconColor = isAutoJoinChecked ? themes[theme].tintActive : themes[theme].auxiliaryTintColor;

		const options = [];

		const permissionsTeam = await RocketChat.hasPermission([editTeamChannelPermission], this.team.rid);
		if (permissionsTeam[0]) {
			options.push({
				title: I18n.t('Auto-join'),
				icon: item.t === 'p' ? 'channel-private' : 'channel-public',
				onPress: () => this.toggleAutoJoin(item),
				right: () => (
					<CustomIcon
						testID={isAutoJoinChecked ? 'auto-join-checked' : 'auto-join-unchecked'}
						name={autoJoinIcon}
						size={20}
						color={autoJoinIconColor}
					/>
				),
				testID: 'action-sheet-auto-join'
			});
		}

		const permissionsRemoveTeam = await RocketChat.hasPermission([removeTeamChannelPermission], this.team.rid);
		if (permissionsRemoveTeam[0]) {
			options.push({
				title: I18n.t('Remove_from_Team'),
				icon: 'close',
				danger: true,
				onPress: () => this.remove(item),
				testID: 'action-sheet-remove-from-team'
			});
		}

		const permissionsChannel = await RocketChat.hasPermission([item.t === 'c' ? deleteCPermission : deletePPermission], item._id);
		if (permissionsChannel[0]) {
			options.push({
				title: I18n.t('Delete'),
				icon: 'delete',
				danger: true,
				onPress: () => this.delete(item),
				testID: 'action-sheet-delete'
			});
		}

		if (options.length === 0) {
			return;
		}
		showActionSheet({ options });
	};

	renderItem = ({ item }: { item: IItem }) => {
		const { StoreLastMessage, useRealName, theme, width, showAvatar, displayMode } = this.props;
		return (
			<RoomItem
				item={item}
				theme={theme}
				type={item.t}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				width={width}
				onLongPress={this.showChannelActions}
				useRealName={useRealName}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				swipeEnabled={false}
				autoJoin={item.teamDefault}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	renderFooter = () => {
		const { loadingMore } = this.state;
		const { theme } = this.props;
		if (loadingMore) {
			return <ActivityIndicator theme={theme} />;
		}
		return null;
	};

	renderScroll = () => {
		const { loading, data, search, isSearching, searchText } = this.state;
		if (loading) {
			return <BackgroundContainer loading />;
		}
		if (isSearching && !search.length) {
			return <BackgroundContainer text={searchText ? I18n.t('No_team_channels_found') : ''} />;
		}
		if (!isSearching && !data.length) {
			return <BackgroundContainer text={I18n.t('No_team_channels_found')} />;
		}

		return (
			<FlatList
				data={isSearching ? search : data}
				extraData={isSearching ? search : data}
				keyExtractor={keyExtractor}
				renderItem={this.renderItem}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				onEndReached={() => this.load()}
				onEndReachedThreshold={0.5}
				ListFooterComponent={this.renderFooter}
			/>
		);
	};

	render() {
		console.count(`${this.constructor.name}.render calls`);
		return (
			<SafeAreaView testID='team-channels-view'>
				<StatusBar />
				{this.renderScroll()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail,
	StoreLastMessage: state.settings.Store_Last_Message,
	addTeamChannelPermission: state.permissions[PERMISSION_ADD_TEAM_CHANNEL],
	editTeamChannelPermission: state.permissions[PERMISSION_EDIT_TEAM_CHANNEL],
	removeTeamChannelPermission: state.permissions[PERMISSION_REMOVE_TEAM_CHANNEL],
	deleteCPermission: state.permissions[PERMISSION_DELETE_C],
	deletePPermission: state.permissions[PERMISSION_DELETE_P],
	showAvatar: state.sortPreferences.showAvatar,
	displayMode: state.sortPreferences.displayMode
});

export default connect(mapStateToProps)(withDimensions(withSafeAreaInsets(withTheme(withActionSheet(TeamChannelsView)))));
