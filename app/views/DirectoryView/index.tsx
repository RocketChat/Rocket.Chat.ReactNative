import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, ListRenderItem } from 'react-native';
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
import { TSupportedThemes, useTheme } from '../../theme'; // Removed withTheme, added useTheme
// import { themes } from '../../lib/constants'; // This comment is still relevant as it explains why 'themes' is not imported.
import { getUserSelector } from '../../selectors/login';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
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
}

const DirectoryView: React.FC<IDirectoryViewProps> = props => {
	// Redux state selectors
	const baseUrl = useAppSelector(state => state.server.server);
	const user = useAppSelector(getUserSelector);
	const isFederationEnabled = useAppSelector(state => state.settings.FEDERATION_Enabled as boolean);
	const directoryDefaultView = useAppSelector(state => state.settings.Accounts_Directory_DefaultView as string);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const [data, setData] = useState<IServerRoom[]>([]);
	const [loading, setLoading] = useState(false);
	const [text, setText] = useState('');
	const [total, setTotal] = useState(-1);
	const [globalUsers, setGlobalUsers] = useState(true);
	const [type, setType] = useState(directoryDefaultView);

	const { theme: themeName, colors } = useTheme();

	// Refs for state values to be used inside debounced load function
	const loadingRef = React.useRef(loading);
	const dataRef = React.useRef(data);
	const totalRef = React.useRef(total);
	const textRef = React.useRef(text);
	const typeRef = React.useRef(type);
	const globalUsersRef = React.useRef(globalUsers);

	useEffect(() => {
		loadingRef.current = loading;
		dataRef.current = data;
		totalRef.current = total;
		textRef.current = text;
		typeRef.current = type;
		globalUsersRef.current = globalUsers;
	}, [loading, data, total, text, type, globalUsers]);

	const load = useCallback(
		debounce(async ({ newSearch = false }: { newSearch?: boolean }) => {
			if (newSearch) {
				setData([]);
				setTotal(-1);
			}

			// Use refs for condition checks to ensure fresh values are used by debounce
			if (loadingRef.current || (dataRef.current.length === totalRef.current && totalRef.current !== -1)) {
				return;
			}

			setLoading(true);

			try {
				const directories = await Services.getDirectory({
					text: textRef.current,
					type: typeRef.current,
					workspace: globalUsersRef.current ? 'all' : 'local',
					offset: dataRef.current.length,
					count: 50,
					sort: typeRef.current === 'users' ? { username: 1 } : { usersCount: -1 }
				});
				if (directories.success) {
					setData(prevData => [...prevData, ...(directories.result as IServerRoom[])]);
					setTotal(directories.total);
				}
				setLoading(false);
			} catch (e) {
				log(e);
				setLoading(false);
			}
		}, 200),
		[setData, setLoading, setTotal] // Dependencies are stable setters & imports. Services and log are stable.
	);

	const search = useCallback(() => {
		load({ newSearch: true });
	}, [load]);

	const onSearchChangeText = useCallback(
		(newText: string) => {
			setText(newText);
			search();
		},
		[setText, search]
	);

	useEffect(() => {
		load({});
	}, [load]);

	const changeType = useCallback(
		(newType: string) => {
			setType(newType);
			setData([]);
			search();

			if (newType === 'users') {
				logEvent(events.DIRECTORY_SEARCH_USERS);
			} else if (newType === 'channels') {
				logEvent(events.DIRECTORY_SEARCH_CHANNELS);
			} else if (newType === 'teams') {
				logEvent(events.DIRECTORY_SEARCH_TEAMS);
			}
			hideActionSheetRef();
		},
		[setType, setData, search] // logEvent, events, hideActionSheetRef are stable imports
	);

	const toggleWorkspace = useCallback(() => {
		setGlobalUsers(prevGlobalUsers => {
			const newGlobalUsers = !prevGlobalUsers;
			setData([]);
			return newGlobalUsers;
		});
		search();
	}, [setGlobalUsers, setData, search]);

	const showFilters = useCallback(() => {
		showActionSheetRef({
			children: (
				<Options
					type={type}
					globalUsers={globalUsers}
					changeType={changeType}
					toggleWorkspace={toggleWorkspace}
					isFederationEnabled={isFederationEnabled}
				/>
			)
		});
	}, [type, globalUsers, isFederationEnabled, changeType, toggleWorkspace]); // showActionSheetRef is stable

	useEffect(() => {
		const { navigation } = props;
		const options: NativeStackNavigationOptions = {
			title: I18n.t('Directory'),
			headerRight: () => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='filter' onPress={showFilters} testID='directory-view-filter' />
				</HeaderButton.Container>
			)
		};
		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} testID='directory-view-close' />;
		}

		navigation.setOptions(options);
	}, [props.navigation, isMasterDetail, showFilters]);

	const goRoomMethod = useCallback(
		(item: TGoRoomItem) => {
			goRoom({ item, isMasterDetail: isMasterDetail, popToRoot: true });
		},
		[isMasterDetail] // goRoom is a stable import
	);

	const onPressItem = useCallback(
		async (item: IServerRoom) => {
			try {
				if (type === 'users') {
					const result = await Services.createDirectMessage(item.username as string);
					if (result.success) {
						goRoomMethod({ rid: result.room._id, name: item.username as string, t: SubscriptionType.DIRECT });
					}
					return;
				}
				const subscription = await getSubscriptionByRoomId(item._id);
				if (subscription) {
					goRoomMethod(subscription);
					return;
				}
				if (['p', 'c'].includes(item.t) && !item.teamMain) {
					const result = await Services.getRoomByTypeAndName(item.t, item.name || item.fname);
					if (result) {
						goRoomMethod({
							rid: item._id,
							name: item.name || item.fname,
							joinCodeRequired: result.joinCodeRequired,
							t: item.t as SubscriptionType,
							search: true
						});
					}
				} else {
					goRoomMethod({
						rid: item._id,
						name: item.name || item.fname,
						t: item.t as SubscriptionType,
						search: true,
						teamMain: item.teamMain,
						teamId: item.teamId
					});
				}
			} catch (e) {
				log(e);
			}
		},
		[type, goRoomMethod] // Services, log, getSubscriptionByRoomId, SubscriptionType are stable
	);

	const renderHeader = () => (
		<>
			<SearchBox onChangeText={onSearchChangeText} onSubmitEditing={search} testID='directory-view-search' />
			<List.Separator />
		</>
	);

	const renderItem: ListRenderItem<IServerRoom> = useCallback(
		({ item, index }) => {
			let style;
			if (index === data.length - 1) {
				style = {
					...sharedStyles.separatorBottom,
					borderColor: colors.strokeLight
				};
			}

			const commonProps = {
				title: item.name as string,
				onPress: () => onPressItem(item),
				baseUrl: baseUrl,
				testID: `directory-view-item-${item.name}`,
				style,
				user: user,
				theme: themeName,
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
		},
		[data, type, baseUrl, user, themeName, colors, onPressItem]
	);

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='directory-view'>
			<StatusBar />
			<FlatList
				data={data}
				style={styles.list}
				contentContainerStyle={styles.listContainer}
				extraData={{ data, loading, text, total, globalUsers, type, themeName }}
				keyExtractor={item => item._id}
				ListHeaderComponent={renderHeader}
				renderItem={renderItem}
				ItemSeparatorComponent={List.Separator}
				keyboardShouldPersistTaps='always'
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
				onEndReached={() => load({})}
			/>
		</SafeAreaView>
	);
};

export default DirectoryView;
