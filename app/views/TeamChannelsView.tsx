import { Q } from '@nozbe/watermelondb';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, FlatList, Keyboard } from 'react-native';
import { connect } from 'react-redux';

import { deleteRoom } from '../actions/room';
import { DisplayMode, themes } from '../lib/constants';
import { TActionSheetOptions, TActionSheetOptionsItem, withActionSheet } from '../containers/ActionSheet';
import ActivityIndicator from '../containers/ActivityIndicator';
import BackgroundContainer from '../containers/BackgroundContainer';
import * as HeaderButton from '../containers/HeaderButton';
import RoomHeader from '../containers/RoomHeader';
import SafeAreaView from '../containers/SafeAreaView';
import SearchHeader from '../containers/SearchHeader';
import StatusBar from '../containers/StatusBar';
import { IApplicationState, IBaseScreen, TSubscriptionModel } from '../definitions';
import { ERoomType } from '../definitions/ERoomType';
import { withDimensions } from '../dimensions';
import I18n from '../i18n';
import database from '../lib/database';
import { CustomIcon } from '../containers/CustomIcon';
import RoomItem, { ROW_HEIGHT } from '../containers/RoomItem';
import { ChatsStackParamList } from '../stacks/types';
import { withTheme } from '../theme';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { showErrorAlert } from '../lib/methods/helpers/info';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import { getRoomAvatar, getRoomTitle, hasPermission, debounce, isIOS, compareServerVersion } from '../lib/methods/helpers';
import { Services } from '../lib/services';

const API_FETCH_COUNT = 25;

const getItemLayout = (data: ArrayLike<IItem> | null | undefined, index: number) => ({
	length: data?.length || 0,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = (item: IItem) => item._id;

export interface IItem {
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

interface ITeamChannelsViewProps extends IBaseScreen<ChatsStackParamList, 'TeamChannelsView'> {
	serverVersion: string;
	useRealName: boolean;
	width: number;
	StoreLastMessage: boolean;
	addTeamChannelPermission: string[];
	moveRoomToTeamPermission: string[];
	editTeamChannelPermission: string[];
	removeTeamChannelPermission: string[];
	createCPermission: string[];
	createTeamChannelPermission: string[];
	createPPermission: string[];
	createTeamGroupPermission: string[];
	deleteCPermission: string[];
	deletePPermission: string[];
	deleteTeamChannelPermission: string[];
	deleteTeamGroupPermission: string[];
	showActionSheet: (options: TActionSheetOptions) => void;
	showAvatar: boolean;
	displayMode: DisplayMode;
}
class TeamChannelsView extends React.Component<ITeamChannelsViewProps, ITeamChannelsViewState> {
	private teamId: string;
	private joined: boolean;
	private teamChannels: TSubscriptionModel[];
	private team: TSubscriptionModel;

	constructor(props: ITeamChannelsViewProps) {
		super(props);
		this.teamChannels = [];
		this.team = {} as TSubscriptionModel;
		this.joined = props.route.params?.joined;
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

	hasCreatePermission = async () => {
		const {
			addTeamChannelPermission,
			moveRoomToTeamPermission,
			serverVersion,
			createCPermission,
			createPPermission,
			createTeamChannelPermission,
			createTeamGroupPermission
		} = this.props;
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
			const createPermissions =
				this.team.t === 'c' ? [createCPermission, createTeamChannelPermission] : [createPPermission, createTeamGroupPermission];
			const result = await hasPermission([moveRoomToTeamPermission, ...createPermissions], this.team.rid);
			return result.some(Boolean);
		}
		const createPermissions = this.team.t === 'c' ? [createCPermission] : [createPPermission];
		const result = await hasPermission([addTeamChannelPermission, ...createPermissions], this.team.rid);
		return result.some(Boolean);
	};

	loadTeam = async () => {
		const { loading, data } = this.state;

		const db = database.active;
		try {
			const subCollection = db.get('subscriptions');
			this.teamChannels = await subCollection.query(Q.where('team_id', Q.eq(this.teamId))).fetch();
			this.team = this.teamChannels?.find((channel: TSubscriptionModel) => channel.teamMain) as TSubscriptionModel;
			this.setHeader();

			if (!this.team) {
				throw new Error();
			}

			const hasCreatePermission = await this.hasCreatePermission();
			if (hasCreatePermission) {
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
			const result = await Services.getTeamListRoom({
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
					newState.search = [...search, ...result.rooms] as IItem[];
				} else {
					newState.data = [...data, ...result.rooms] as IItem[];
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
		const { isSearching, showCreate } = this.state;
		const { navigation } = this.props;

		const { team } = this;
		if (!team) {
			return;
		}

		if (isSearching) {
			const options: NativeStackNavigationOptions = {
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item iconName='close' onPress={this.onCancelSearchPress} />
					</HeaderButton.Container>
				),
				headerTitle: () => (
					<SearchHeader onSearchChangeText={this.onSearchChangeText} testID='team-channels-view-search-header' />
				),
				headerRight: () => null
			};
			return navigation.setOptions(options);
		}

		const options: NativeStackNavigationOptions = {
			headerLeft: () => null,
			headerTitle: () => (
				<RoomHeader title={getRoomTitle(team)} subtitle={team.topic} type={team.t} onPress={this.goRoomActionsView} teamMain />
			),
			headerRight: () => (
				<HeaderButton.Container>
					{showCreate ? (
						<HeaderButton.Item
							iconName='create'
							testID='team-channels-view-create'
							onPress={() =>
								navigation.navigate('AddChannelTeamView', { teamId: this.teamId, rid: this.team.rid, t: this.team.t as any })
							}
						/>
					) : null}
					<HeaderButton.Item iconName='search' testID='team-channels-view-search' onPress={this.onSearchPress} />
				</HeaderButton.Container>
			)
		};

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
		const { team, joined } = this;
		const { navigation, isMasterDetail } = this.props;
		if (!team) {
			return;
		}
		if (isMasterDetail && screen) {
			navigation.navigate('ModalStackNavigator', {
				screen: 'RoomActionsView',
				params: {
					rid: team.rid,
					t: team.t,
					room: team,
					joined
				}
			});
		} else {
			navigation.navigate('RoomActionsView', {
				rid: team.rid,
				t: team.t,
				room: team,
				joined
			});
		}
	};

	onPressItem = debounce(
		async (item: IItem) => {
			logEvent(events.TC_GO_ROOM);
			const { isMasterDetail } = this.props;
			try {
				let params = {};
				const result = await Services.getRoomInfo(item._id);
				if (result.success) {
					params = {
						rid: item._id,
						name: getRoomTitle(result.room),
						joinCodeRequired: result.room.joinCodeRequired,
						t: result.room.t,
						teamId: result.room.teamId
					};
				}
				goRoom({ item: params, isMasterDetail, popToRoot: !!isMasterDetail });
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
			const result = await Services.updateTeamRoom({ roomId: item._id, isDefault: !item.teamDefault });
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
			const result = await Services.removeTeamRoom({ roomId: item._id, teamId: this.team.teamId as string });
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
					onPress: () => dispatch(deleteRoom(ERoomType.c, item))
				}
			],
			{ cancelable: false }
		);
	};

	hasDeletePermission = async (rid: string, t: 'c' | 'p') => {
		const { serverVersion, deleteCPermission, deletePPermission, deleteTeamChannelPermission, deleteTeamGroupPermission } =
			this.props;
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '7.0.0')) {
			const permissions =
				t === 'c' ? [deleteTeamChannelPermission, deleteTeamGroupPermission] : [deletePPermission, deletePPermission];
			const result = await hasPermission(permissions, rid);
			return result[0] && result[1];
		}

		const result = await hasPermission([t === 'c' ? deleteCPermission : deletePPermission], rid);
		return result[0];
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
		const autoJoinIconColor = isAutoJoinChecked ? themes[theme].fontHint : themes[theme].fontDefault;

		const options: TActionSheetOptionsItem[] = [];

		const permissionsTeam = await hasPermission([editTeamChannelPermission], this.team.rid);
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

		const permissionsRemoveTeam = await hasPermission([removeTeamChannelPermission], this.team.rid);
		if (permissionsRemoveTeam[0]) {
			options.push({
				title: I18n.t('Remove_from_Team'),
				icon: 'close',
				danger: true,
				onPress: () => this.remove(item),
				testID: 'action-sheet-remove-from-team'
			});
		}

		const permissionsChannel = await hasPermission([item.t === 'c' ? deleteCPermission : deletePPermission], item._id);
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
		const { StoreLastMessage, useRealName, width, showAvatar, displayMode } = this.props;
		return (
			<RoomItem
				item={item}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				width={width}
				onLongPress={this.showChannelActions}
				useRealName={useRealName}
				getRoomTitle={getRoomTitle}
				getRoomAvatar={getRoomAvatar}
				swipeEnabled={false}
				autoJoin={item.teamDefault}
				showAvatar={showAvatar}
				displayMode={displayMode}
			/>
		);
	};

	renderFooter = () => {
		const { loadingMore } = this.state;
		if (loadingMore) {
			return <ActivityIndicator />;
		}
		return null;
	};

	renderScroll = () => {
		const { loading, data, search, isSearching, searchText } = this.state;
		if (loading) {
			return <BackgroundContainer loading />;
		}
		if (isSearching && !search.length) {
			return <BackgroundContainer text={searchText ? I18n.t('No_channels_in_team') : ''} />;
		}
		if (!isSearching && !data.length) {
			return <BackgroundContainer text={I18n.t('No_channels_in_team')} />;
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
	serverVersion: state.server.version,
	useRealName: state.settings.UI_Use_Real_Name,
	isMasterDetail: state.app.isMasterDetail,
	StoreLastMessage: state.settings.Store_Last_Message,
	addTeamChannelPermission: state.permissions['add-team-channel'],
	moveRoomToTeamPermission: state.permissions['move-room-to-team'],
	editTeamChannelPermission: state.permissions['edit-team-channel'],
	removeTeamChannelPermission: state.permissions['remove-team-channel'],
	deleteCPermission: state.permissions['delete-c'],
	createCPermission: state.permissions['create-c'],
	createTeamChannelPermission: state.permissions['create-team-channel'],
	createPPermission: state.permissions['create-p'],
	createTeamGroupPermission: state.permissions['create-team-group'],
	deleteTeamChannelPermission: state.permissions['delete-team-channel'],
	deletePPermission: state.permissions['delete-p'],
	deleteTeamGroupPermission: state.permissions['delete-team-group'],
	showAvatar: state.sortPreferences.showAvatar,
	displayMode: state.sortPreferences.displayMode
});

export default connect(mapStateToProps)(withDimensions(withTheme(withActionSheet(TeamChannelsView))));
