import React from 'react';
import { FlatList, ListRenderItem, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';

import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import * as List from '../../containers/List';
import Touch from '../../utils/touch';
import DirectoryItem from '../../containers/DirectoryItem';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import { CustomIcon, TIconsName } from '../../containers/CustomIcon';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import debounce from '../../utils/debounce';
import log, { events, logEvent } from '../../utils/log';
import { TSupportedThemes, withTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom, TGoRoomItem } from '../../utils/goRoom';
import { IApplicationState, IServerRoom, IUser, SubscriptionType } from '../../definitions';
import styles from './styles';
import Options from './Options';
import { Services } from '../../lib/services';

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
	text: string;
	total: number;
	showOptionsDropdown: boolean;
	globalUsers: boolean;
	type: string;
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
			text: '',
			total: -1,
			showOptionsDropdown: false,
			globalUsers: true,
			type: props.directoryDefaultView
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
			const { data, type, globalUsers } = this.state;
			const query = { text, type, workspace: globalUsers ? 'all' : 'local' };
			const directories = await Services.getDirectory({
				query,
				offset: data.length,
				count: 50,
				sort: type === 'users' ? { username: 1 } : { usersCount: -1 }
			});
			if (directories.success) {
				this.setState({
					data: [...data, ...(directories.result as IServerRoom[])],
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
	};

	toggleWorkspace = () => {
		this.setState(
			({ globalUsers }) => ({ globalUsers: !globalUsers, data: [] }),
			() => this.search()
		);
	};

	toggleDropdown = () => {
		this.setState(({ showOptionsDropdown }) => ({ showOptionsDropdown: !showOptionsDropdown }));
	};

	goRoom = (item: TGoRoomItem) => {
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('DrawerNavigator');
		} else {
			navigation.navigate('RoomsListView');
		}
		goRoom({ item, isMasterDetail });
	};

	onPressItem = async (item: IServerRoom) => {
		const { type } = this.state;
		if (type === 'users') {
			const result = await Services.createDirectMessage(item.username as string);
			if (result.success) {
				this.goRoom({ rid: result.room._id, name: item.username, t: SubscriptionType.DIRECT });
			}
		} else if (['p', 'c'].includes(item.t) && !item.teamMain) {
			const result = await Services.getRoomInfo(item._id);
			if (result.success) {
				this.goRoom({
					rid: item._id,
					name: item.name,
					joinCodeRequired: result.room.joinCodeRequired,
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
		const { type } = this.state;
		const { theme } = this.props;
		let text = 'Users';
		let icon: TIconsName = 'user';

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
				<Touch onPress={this.toggleDropdown} style={styles.dropdownItemButton} testID='directory-view-dropdown' theme={theme}>
					<View
						style={[
							sharedStyles.separatorVertical,
							styles.toggleDropdownContainer,
							{ borderColor: themes[theme].separatorColor }
						]}>
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
			</>
		);
	};

	renderItem: ListRenderItem<IServerRoom> = ({ item, index }) => {
		const { data, type } = this.state;
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
			testID: `directory-view-item-${item.name}`.toLowerCase(),
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
		const { data, loading, showOptionsDropdown, type, globalUsers } = this.state;
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
				{showOptionsDropdown ? (
					<Options
						theme={theme}
						type={type}
						globalUsers={globalUsers}
						close={this.toggleDropdown}
						changeType={this.changeType}
						toggleWorkspace={this.toggleWorkspace}
						isFederationEnabled={isFederationEnabled}
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
