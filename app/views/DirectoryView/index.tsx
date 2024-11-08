import React from 'react';
import { FlatList, ListRenderItem } from 'react-native';
import { connect } from 'react-redux';
import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';

import { hideActionSheetRef, showActionSheetRef } from '../../containers/ActionSheet';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import * as List from '../../containers/List';
import DirectoryItem from '../../containers/DirectoryItem';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import * as HeaderButton from '../../containers/HeaderButton';
import { debounce } from '../../lib/methods/helpers';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { TSupportedThemes, withTheme } from '../../theme';
import { themes } from '../../lib/constants';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import { goRoom, TGoRoomItem } from '../../lib/methods/helpers/goRoom';
import { IApplicationState, IServerRoom, IUser, SubscriptionType } from '../../definitions';
import styles from './styles';
import Options from './Options';
import { Services } from '../../lib/services';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';

interface IDirectoryViewProps {
	navigation: CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'DirectoryView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
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
	globalUsers: boolean;
	type: string;
}

class DirectoryView extends React.Component<IDirectoryViewProps, IDirectoryViewState> {
	constructor(props: IDirectoryViewProps) {
		super(props);
		this.state = {
			data: [],
			loading: false,
			text: '',
			total: -1,
			globalUsers: true,
			type: props.directoryDefaultView
		};
		this.setHeader();
	}

	componentDidMount() {
		this.load({});
	}

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
		const options: NativeStackNavigationOptions = {
			title: I18n.t('Directory'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='filter' onPress={this.showFilters} testID='directory-view-filter' />
				</HeaderButton.Container>
			)
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='directory-view-close' />;
		}

		navigation.setOptions(options);
	};

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
			const directories = await Services.getDirectory({
				text,
				type,
				workspace: globalUsers ? 'all' : 'local',
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
		hideActionSheetRef();
	};

	toggleWorkspace = () => {
		this.setState(
			({ globalUsers }) => ({ globalUsers: !globalUsers, data: [] }),
			() => this.search()
		);
	};

	showFilters = () => {
		const { type, globalUsers } = this.state;
		const { isFederationEnabled } = this.props;
		showActionSheetRef({
			children: (
				<Options
					type={type}
					globalUsers={globalUsers}
					changeType={this.changeType}
					toggleWorkspace={this.toggleWorkspace}
					isFederationEnabled={isFederationEnabled}
				/>
			)
		});
	};

	goRoom = (item: TGoRoomItem) => {
		const { isMasterDetail } = this.props;
		goRoom({ item, isMasterDetail, popToRoot: true });
	};

	onPressItem = async (item: IServerRoom) => {
		try {
			const { type } = this.state;
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
		} catch {
			// do nothing
		}
		
	};

	renderHeader = () => (
		<>
			<SearchBox onChangeText={this.onSearchChangeText} onSubmitEditing={this.search} testID='directory-view-search' />
			<List.Separator />
		</>
	);

	renderItem: ListRenderItem<IServerRoom> = ({ item, index }) => {
		const { data, type } = this.state;
		const { baseUrl, user, theme } = this.props;

		let style;
		if (index === data.length - 1) {
			style = {
				...sharedStyles.separatorBottom,
				borderColor: themes[theme].strokeLight
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
		const { data, loading } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].surfaceRoom }} testID='directory-view'>
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
