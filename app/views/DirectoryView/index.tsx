import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { FlatList, ListRenderItem, Text, View } from 'react-native';
import { connect } from 'react-redux';

import ActivityIndicator from '../../containers/ActivityIndicator';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import DirectoryItem from '../../containers/DirectoryItem';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import Touch from '../../containers/Touch';
import { IApplicationState, IServerRoom, IUser, SubscriptionType } from '../../definitions';
import I18n from '../../i18n';
import { themes } from '../../lib/constants';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { debounce } from '../../lib/methods/helpers';
import { TGoRoomItem, goRoom } from '../../lib/methods/helpers/goRoom';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import { getUserSelector } from '../../selectors/login';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { ChatsStackParamList } from '../../stacks/types';
import { TSupportedThemes, withTheme } from '../../theme';
import sharedStyles from '../Styles';
import Options from './Options';
import SortOptions from './SortOptions';
import styles from './styles';

interface IDirectoryViewProps {
	navigation: CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'DirectoryView'>,
	StackNavigationProp<MasterDetailInsideStackParamList>
	>;
	baseUrl: string;
	isFederationEnabled: boolean;
	user: IUser;
	theme: TSupportedThemes;
	directoryDefaultView: string;
	isMasterDetail: boolean;
}

interface IDirectoryViewState {
	data: IServerRoom[];
	loading: boolean;

	total: number;
	globalUsers: boolean;
	text: string;
	searchBy: string;
	sortName: 'default' | 'channel' | 'user';
	showSearchByDropdown: boolean;
	sortBy: "ascending" | "descending";
	showSortByDropdown: boolean;
}

class DirectoryView extends React.Component<IDirectoryViewProps, IDirectoryViewState> {
	static navigationOptions = ({ navigation, isMasterDetail }: IDirectoryViewProps) => {
		const options: StackNavigationOptions = {
			title: I18n.t('Directory')
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='directory-view-close' />;
		}
		return options;
	};

	constructor(props: IDirectoryViewProps) {
		super(props);
		this.state = {
			data: [],
			loading: false,
			total: -1,
			globalUsers: true,
			text: '',
			sortBy: 'ascending',
			sortName: 'default',
			showSortByDropdown: false,
			searchBy: props.directoryDefaultView,
			showSearchByDropdown: false
		};
	}

	componentDidMount() {
		this.load({});
	}

	onSearchChangeText = (text: string) => {
		this.setState({ text }, this.search);
	};

	load = debounce(async ({ newSearch = false }) => {
		if (newSearch) {
			this.setState({ data: [], total: -1, loading: false });
		}

		const {
			loading,
			text,
			total,
			data: { length }
		} = this.state;
		if (loading || length === total) {
			return;
		}

		this.setState({ loading: true });

		try {
			const { data, searchBy: type, globalUsers } = this.state;
			const query = { text, type, workspace: globalUsers ? 'all' : 'local' };
			const directories = await Services.getDirectory({
				query,
				offset: data.length,
				count: 50,
				sort: type === 'users' ? { username: 1 } : { usersCount: -1 }
			});

			console.log("checking sorting state",this.state.sortBy, this.state.sortName);
			if (directories.success) {
				const finalData = [...data, ...(directories.result as IServerRoom[])];
				if (this.state.sortName !== 'default') {
					switch (this.state.sortName) {
						case 'channel':
							if (this.state.sortBy === 'ascending') {
								finalData.sort((x, y) => {
									if (x.name && y.name) {
										return x.name.localeCompare(y.name);
									}
									return 0;
								});
							}
							if (this.state.sortBy === 'descending') {
								finalData.sort((x, y) => {
									if (x.name && y.name) {
										return y.name.localeCompare(x.name);
									}
									return 0;
								});
							}
							break;
						case 'user':
							if (this.state.sortBy === 'ascending') {
								finalData.sort((x, y) => {
									if (x.usersCount !== undefined && y.usersCount !== undefined) {
										return x.usersCount - y.usersCount;
									}
									return 0;
								});
							}
							if (this.state.sortBy === 'descending') {
								finalData.sort((x, y) => {
									if (x.usersCount !== undefined && y.usersCount !== undefined) {
										return y.usersCount - x.usersCount;
									}
									return 0;
								});
							}
							break;
					}

				}
				this.setState({
					data: finalData,
					loading: false,
					total: directories.total
				});
			} else {
				this.setState({ loading: false });
			}
		} catch (e) {
			log(e);
			this.setState({ loading: false });
		}
	}, 200);

	search = () => {
		this.load({ newSearch: true });
	};

	changeType = (type: string) => {
		this.setState({ type, data: [] }, () => this.search());

		if (type === 'users') {
			logEvent(events.DIRECTORY_SEARCH_USERS);
		} else if (type === 'channels') {
			logEvent(events.DIRECTORY_SEARCH_CHANNELS);
		} else if (type === 'teams') {
			logEvent(events.DIRECTORY_SEARCH_TEAMS);
		}
		this.toggleDropdown()
	};

	toggleWorkspace = () => {
		this.setState(
			({ globalUsers }) => ({ globalUsers: !globalUsers, data: [] }),
			() => this.search()
		);
	};

	toggleSearchByDropdown = () => {
		this.setState(({ showSearchByDropdown }) => ({ showSearchByDropdown: !showSearchByDropdown }));
	};

	toggleSortByDropdown = () => {
		this.setState(({ showSortByDropdown }) => ({ showSortByDropdown: !showSortByDropdown }));
	};

	changeSearchByMethod = (searchBy: string) => {
		this.setState({ searchBy, data: [], showSearchByDropdown: false }, () => this.search());

		if (searchBy === 'users') {
			logEvent(events.DIRECTORY_SEARCH_USERS);
		} else if (searchBy === 'channels') {
			logEvent(events.DIRECTORY_SEARCH_CHANNELS);
		} else if (searchBy === 'teams') {
			logEvent(events.DIRECTORY_SEARCH_TEAMS);
		}
	};

	changeSortByMethod = (sortName: IDirectoryViewState['sortName'], sortBy: IDirectoryViewState['sortBy']) => {
		this.setState({ sortName, sortBy, data: [], showSortByDropdown: false }, () => this.search());

		switch (sortName) {
			case 'channel':
				if (sortBy === 'ascending') {
					logEvent(events.DIRECTORY_CHANNEL_SORT_ASCENDING);
				} else if (sortBy === 'descending') {
					logEvent(events.DIRECTORY_CHANNEL_SORT_DESCENDING);
				}
				break;
			case 'user':
				if (sortBy === 'ascending') {
					logEvent(events.DIRECTORY_USER_SORT_ASCENDING);
				} else if (sortBy === 'descending') {
					logEvent(events.DIRECTORY_USER_SORT_DESCENDING);
				}
				break;
		}
	};

	goRoom = (item: TGoRoomItem) => {
		const { isMasterDetail } = this.props;
		goRoom({ item, isMasterDetail, popToRoot: true });
	};

	onPressItem = async (item: IServerRoom) => {
		const { searchBy: type } = this.state;
		if (type === 'users') {
			const result = await Services.createDirectMessage(item.username as string);
			if (result.success) {
				this.goRoom({ rid: result.room._id, name: item.username, t: SubscriptionType.DIRECT });
			}
			return;
		}
		const subscription = await getSubscriptionByRoomId(item._id);
		if (subscription) {
			this.goRoom(subscription);
			return;
		}
		if (['p', 'c'].includes(item.t) && !item.teamMain) {
			const result = await Services.getRoomByTypeAndName(item.t, item.name || item.fname);
			if (result) {
				this.goRoom({
					rid: item._id,
					name: item.name,
					joinCodeRequired: result.joinCodeRequired,
					t: item.t as SubscriptionType,
					search: true
				});
			}
		} else {
			this.goRoom({
				rid: item._id,
				name: item.name,
				t: item.t as SubscriptionType,
				search: true,
				teamMain: item.teamMain,
				teamId: item.teamId
			});
		}
	};

	renderHeader = () => {
		const { searchBy: type } = this.state;
		const { theme } = this.props;
		let text = 'Users';
		let icon: TIconsName = 'user';
		const filter: TIconsName = 'filter';

		if (type === 'channels') {
			text = 'Channels';
			icon = 'channel-public';
		}

		if (type === 'teams') {
			text = 'Teams';
			icon = 'teams';
		}

		return (
			<>
				<SearchBox onChangeText={this.onSearchChangeText} onSubmitEditing={this.search} testID='directory-view-search' />

				{/* code for toggleDropdown */}
				<View style={styles.checkingView}>
					<Touch onPress={this.toggleSearchByDropdown} style={styles.dropdownItemButton} testID='directory-view-dropdown'>
						<View
							style={[
								sharedStyles.separatorVertical,
								styles.toggleDropdownContainer,
								{ borderColor: themes[theme].separatorColor }
							]}
						>
							<CustomIcon name={icon} size={20} color={themes[theme].tintColor} style={styles.toggleDropdownIcon} />
							<Text style={[styles.toggleDropdownText, { color: themes[theme].tintColor }]}>{I18n.t(text)}</Text>
							<CustomIcon
								name='chevron-down'
								size={20}
								color={themes[theme].auxiliaryTintColor}
								style={styles.toggleDropdownArrow}
							/>
						</View>
					</Touch>
					<Touch
						onPress={this.toggleSortByDropdown}
						style={styles.dropdownAdditionalItemButton}
						testID='directory-view-additional-dropdown'
					>
						<View
							style={[sharedStyles.separatorVertical, styles.dropdownItemButton, { borderColor: themes[theme].separatorColor }]}
						>
							<CustomIcon name={filter} size={20} color={themes[theme].auxiliaryTintColor} style={styles.toggleDropdownIcon} />
						</View>
					</Touch>
				</View>
			</>
		);
	};

	renderItem: ListRenderItem<IServerRoom> = ({ item, index }) => {
		const { data, searchBy: type } = this.state;
		const { baseUrl, user, theme } = this.props;

		let style;
		if (index === data.length - 1) {
			style = {
				...sharedStyles.separatorBottom,
				borderColor: themes[theme].separatorColor
			};
		}

		const commonProps = {
			title: item.name as string,
			onPress: () => this.onPressItem(item),
			baseUrl,
			testID: `directory-view-item-${item.name}`,
			style,
			user,
			theme,
			rid: item._id
		};

		if (type === 'users') {
			return (
				<DirectoryItem
					avatar={item.username}
					description={item.username}
					rightLabel={item.federation && item.federation.peer}
					type='d'
					{...commonProps}
				/>
			);
		}

		if (type === 'teams') {
			return (
				<DirectoryItem
					avatar={item.name}
					description={item.name}
					rightLabel={I18n.t('N_channels', { n: item.roomsCount })}
					type={item.t}
					teamMain={item.teamMain}
					{...commonProps}
				/>
			);
		}
		return (
			<DirectoryItem
				avatar={item.name}
				description={item.topic}
				rightLabel={I18n.t('N_users', { n: item.usersCount })}
				type={item.t}
				{...commonProps}
			/>
		);
	};

	render = () => {
		const {
			data,
			loading,
			showSearchByDropdown,
			showSortByDropdown,
			searchBy: type,
			sortBy,
			globalUsers
		} = this.state;
		const { isFederationEnabled, theme } = this.props;
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='directory-view'>
				<StatusBar />
				<FlatList
					data={data}
					style={styles.list}
					contentContainerStyle={styles.listContainer}
					extraData={this.state}
					keyExtractor={item => item._id}
					ListHeaderComponent={this.renderHeader}
					renderItem={this.renderItem}
					ItemSeparatorComponent={List.Separator}
					keyboardShouldPersistTaps='always'
					ListFooterComponent={loading ? <ActivityIndicator /> : null}
					onEndReached={() => this.load({})}
				/>
				{showSearchByDropdown ? (
					<Options
						theme={theme}
						type={type}
						globalUsers={globalUsers}
						close={this.toggleSearchByDropdown}
						changeType={this.changeSearchByMethod}
						toggleWorkspace={this.toggleWorkspace}
						isFederationEnabled={isFederationEnabled}
					/>
				) : null}
				{showSortByDropdown ? (
					<SortOptions
						theme={theme}
						close={this.toggleSortByDropdown}
						selected={sortBy}
						changeSelection={this.changeSortByMethod}
					/>
				) : null}
			</SafeAreaView>
		);
	};
}

const mapStateToProps = (state: IApplicationState) => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	isFederationEnabled: state.settings.FEDERATION_Enabled as boolean,
	directoryDefaultView: state.settings.Accounts_Directory_DefaultView as string,
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(DirectoryView));