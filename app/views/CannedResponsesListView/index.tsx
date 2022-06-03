import React, { useEffect, useState, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';

import database from '../../lib/database';
import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import SearchHeader from '../../containers/SearchHeader';
import BackgroundContainer from '../../containers/BackgroundContainer';
import { getHeaderTitlePosition } from '../../containers/Header';
import { useTheme } from '../../theme';
import debounce from '../../utils/debounce';
import Navigation from '../../lib/navigation/appNavigation';
import { goRoom } from '../../utils/goRoom';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import { themes } from '../../lib/constants';
import log from '../../utils/log';
import CannedResponseItem from './CannedResponseItem';
import Dropdown from './Dropdown';
import DropdownItemHeader from './Dropdown/DropdownItemHeader';
import styles from './styles';
import { ICannedResponse } from '../../definitions/ICannedResponse';
import { ChatsStackParamList } from '../../stacks/types';
import { ISubscription } from '../../definitions/ISubscription';
import { getRoomTitle, getUidDirectMessage } from '../../lib/methods';
import { Services } from '../../lib/services';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';
import { useAppSelector } from '../../lib/hooks';

const COUNT = 25;

const fixedScopes = [
	{
		_id: 'all',
		name: I18n.t('All')
	},
	{
		_id: 'global',
		name: I18n.t('Public')
	},
	{
		_id: 'user',
		name: I18n.t('Private')
	}
] as ILivechatDepartment[];

interface ICannedResponsesListViewProps {
	navigation: StackNavigationProp<ChatsStackParamList, 'CannedResponsesListView'>;
	route: RouteProp<ChatsStackParamList, 'CannedResponsesListView'>;
}

const CannedResponsesListView = ({ navigation, route }: ICannedResponsesListViewProps): JSX.Element => {
	const [room, setRoom] = useState<ISubscription | null>(null);

	const [cannedResponses, setCannedResponses] = useState<ICannedResponse[]>([]);
	const [cannedResponsesScopeName, setCannedResponsesScopeName] = useState<ICannedResponse[]>([]);
	const [departments, setDepartments] = useState<ILivechatDepartment[]>([]);

	// states used by the filter in Header and Dropdown
	const [isSearching, setIsSearching] = useState(false);
	const [currentDepartment, setCurrentDepartment] = useState(fixedScopes[0]);
	const [showFilterDropdown, setShowFilterDropDown] = useState(false);

	// states used to do a fetch by onChangeText, onDepartmentSelect and onEndReached
	const [searchText, setSearchText] = useState('');
	const [scope, setScope] = useState('');
	const [departmentId, setDepartmentId] = useState('');
	const [loading, setLoading] = useState(true);
	const [offset, setOffset] = useState(0);

	const insets = useSafeAreaInsets();
	const { theme } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const rooms = useAppSelector(state => state.room.rooms);

	const getRoomFromDb = async () => {
		const { rid } = route.params;
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		try {
			const r = await subsCollection.find(rid);
			setRoom(r);
		} catch (error) {
			console.log('CannedResponsesListView: Room not found');
			log(error);
		}
	};

	const getDepartments = debounce(async () => {
		try {
			const res = await Services.getDepartments();
			if (res.success) {
				setDepartments([...fixedScopes, ...(res.departments as ILivechatDepartment[])]);
			}
		} catch (e) {
			setDepartments(fixedScopes);
			log(e);
		}
	}, 300);

	const goToDetail = (item: ICannedResponse) => {
		if (room) {
			navigation.navigate('CannedResponseDetail', { cannedResponse: item, room });
		}
	};

	const navigateToRoom = (item: ICannedResponse) => {
		if (!room) {
			return;
		}
		const { name } = room;
		const params = {
			rid: room.rid,
			name: getRoomTitle({
				t: room.t,
				fname: name
			}),
			t: room.t,
			roomUserId: getUidDirectMessage(room),
			usedCannedResponse: item.text
		};

		if (room.rid) {
			// if it's on master detail layout, we close the modal and replace RoomView
			if (isMasterDetail) {
				Navigation.navigate('DrawerNavigator');
				goRoom({ item: params, isMasterDetail });
			} else {
				let navigate = navigation.push;
				// if this is a room focused
				if (rooms.includes(room.rid)) {
					({ navigate } = navigation);
				}
				navigate('RoomView', params);
			}
		}
	};

	const getListCannedResponse = async ({
		text,
		department,
		depId,
		debounced
	}: {
		text: string;
		department: string;
		depId: string;
		debounced: boolean;
	}) => {
		try {
			const res = await Services.getListCannedResponse({
				text,
				offset,
				count: COUNT,
				departmentId: depId,
				scope: department
			});
			if (res.success) {
				// search with changes on text or scope are debounced
				// the begin result and pagination aren't debounced
				setCannedResponses(prevCanned => (debounced ? res.cannedResponses : [...prevCanned, ...res.cannedResponses]));
				setLoading(false);
				setOffset(prevOffset => prevOffset + COUNT);
			}
		} catch (e) {
			log(e);
		}
	};

	useEffect(() => {
		if (departments.length > 0) {
			const newCannedResponses = cannedResponses.map(cr => {
				let scopeName = '';

				if (cr?.departmentId) {
					scopeName = departments.filter(dep => dep._id === cr.departmentId)[0]?.name || 'Department';
				} else {
					scopeName = departments.filter(dep => dep._id === cr.scope)[0]?.name;
				}
				cr.scopeName = scopeName;

				return cr;
			});
			setCannedResponsesScopeName(newCannedResponses);
		}
	}, [departments, cannedResponses]);

	const searchCallback = useCallback(
		debounce(async (text = '', department = '', depId = '') => {
			await getListCannedResponse({ text, department, depId, debounced: true });
		}, 1000),
		[]
	); // use debounce with useCallback https://stackoverflow.com/a/58594890

	useEffect(() => {
		getRoomFromDb();
		getDepartments();
		getListCannedResponse({ text: '', department: '', depId: '', debounced: false });
	}, []);

	const newSearch = () => {
		setCannedResponses([]);
		setLoading(true);
		setOffset(0);
	};

	const onChangeText = (text: string) => {
		newSearch();
		setSearchText(text);
		searchCallback(text, scope, departmentId);
	};

	const onDepartmentSelect = (value: ILivechatDepartment) => {
		let department = '';
		let depId = '';

		if (value._id === fixedScopes[0]._id) {
			department = '';
		} else if (value._id === fixedScopes[1]._id) {
			department = 'global';
		} else if (value._id === fixedScopes[2]._id) {
			department = 'user';
		} else {
			department = 'department';
			depId = value._id;
		}

		newSearch();
		setCurrentDepartment(value);
		setScope(department);
		setDepartmentId(depId);
		setShowFilterDropDown(false);
		searchCallback(searchText, department, depId);
	};

	const onEndReached = async () => {
		if (cannedResponses.length < offset || loading) {
			return;
		}
		setLoading(true);
		await getListCannedResponse({ text: searchText, department: scope, depId: departmentId, debounced: false });
	};

	const getHeader = (): StackNavigationOptions => {
		if (isSearching) {
			const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: 1 });
			return {
				headerTitleAlign: 'left',
				headerLeft: () => (
					<HeaderButton.Container left>
						<HeaderButton.Item
							iconName='close'
							onPress={() => {
								onChangeText('');
								setIsSearching(false);
							}}
						/>
					</HeaderButton.Container>
				),
				headerTitle: () => <SearchHeader onSearchChangeText={onChangeText} testID='team-channels-view-search-header' />,
				headerTitleContainerStyle: {
					left: headerTitlePosition.left,
					right: headerTitlePosition.right
				},
				headerRight: () => null
			};
		}

		const options: StackNavigationOptions = {
			headerLeft: () => (
				<HeaderBackButton labelVisible={false} onPress={() => navigation.pop()} tintColor={themes[theme].headerTintColor} />
			),
			headerTitleAlign: 'center',
			headerTitle: I18n.t('Canned_Responses'),
			headerTitleContainerStyle: {
				left: 0,
				right: 0
			}
		};

		if (isMasterDetail) {
			options.headerLeft = () => <HeaderButton.CloseModal navigation={navigation} />;
		}

		options.headerRight = () => (
			<HeaderButton.Container>
				<HeaderButton.Item iconName='search' onPress={() => setIsSearching(true)} />
			</HeaderButton.Container>
		);
		return options;
	};

	const setHeader = () => {
		const options = getHeader();
		navigation.setOptions(options);
	};

	useEffect(() => {
		setHeader();
	}, [isSearching]);

	const showDropdown = () => {
		if (isSearching) {
			setSearchText('');
			setIsSearching(false);
		}
		setShowFilterDropDown(true);
	};

	const renderFlatListHeader = () => {
		if (!departments.length) {
			return null;
		}
		return (
			<>
				<DropdownItemHeader department={currentDepartment} onPress={showDropdown} />
				<List.Separator />
			</>
		);
	};

	const renderContent = () => {
		if (!cannedResponsesScopeName.length && !loading) {
			return (
				<>
					{renderFlatListHeader()}
					<BackgroundContainer text={I18n.t('No_canned_responses')} />
				</>
			);
		}
		return (
			<FlatList
				data={cannedResponsesScopeName}
				extraData={cannedResponsesScopeName}
				style={[styles.list, { backgroundColor: themes[theme].backgroundColor }]}
				renderItem={({ item }) => (
					<CannedResponseItem
						theme={theme}
						scope={item.scopeName}
						shortcut={item.shortcut}
						tags={item?.tags}
						text={item.text}
						onPressDetail={() => goToDetail(item)}
						onPressUse={() => navigateToRoom(item)}
					/>
				)}
				keyExtractor={item => item._id || item.shortcut}
				ListHeaderComponent={renderFlatListHeader}
				stickyHeaderIndices={[0]}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
			/>
		);
	};

	return (
		<SafeAreaView>
			<StatusBar />
			{renderContent()}
			{showFilterDropdown ? (
				<Dropdown
					departments={departments}
					currentDepartment={currentDepartment}
					onDepartmentSelected={onDepartmentSelect}
					onClose={() => setShowFilterDropDown(false)}
				/>
			) : null}
		</SafeAreaView>
	);
};

export default CannedResponsesListView;
