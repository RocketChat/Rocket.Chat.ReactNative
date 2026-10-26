import { useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { type RouteProp } from '@react-navigation/native';
import { type NativeStackNavigationOptions, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type SearchBarCommands } from 'react-native-screens';

import database from '~/lib/database';
import I18n from '~/i18n';
import { searchHeaderOptions } from '~/lib/methods/helpers/navigation/searchHeaderOptions';
import { hideActionSheetRef, showActionSheetRef } from '~/containers/ActionSheet';
import SafeAreaView from '~/containers/SafeAreaView';
import ActivityIndicator from '~/containers/ActivityIndicator';
import BackgroundContainer from '~/containers/BackgroundContainer';
import { useTheme } from '~/theme';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import * as List from '~/containers/List';
import { themes } from '~/lib/constants/colors';
import log from '~/lib/methods/helpers/log';
import CannedResponseItem from './CannedResponseItem';
import DepartmentFilter from './DepartmentFilter';
import styles from './styles';
import { type ICannedResponse } from '~/definitions/ICannedResponse';
import { type ChatsStackParamList } from '~/stacks/types';
import { useDebounce } from '~/lib/methods/helpers';
import { getListCannedResponse, getDepartments } from '~/lib/services/restApi';
import { type ILivechatDepartment } from '~/definitions/ILivechatDepartment';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { type ISubscription } from '~/definitions';

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
	navigation: NativeStackNavigationProp<ChatsStackParamList, 'CannedResponsesListView'>;
	route: RouteProp<ChatsStackParamList, 'CannedResponsesListView'>;
}

const CannedResponsesListView = ({ navigation, route }: ICannedResponsesListViewProps) => {
	const roomRef = useRef<ISubscription | null>(null);

	const [cannedResponses, setCannedResponses] = useState<ICannedResponse[]>([]);
	const [departments, setDepartments] = useState<ILivechatDepartment[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [currentDepartment, setCurrentDepartment] = useState(fixedScopes[0]);

	const searchTextRef = useRef('');
	const scopeRef = useRef('');
	const departmentIdRef = useRef('');
	const [loading, setLoading] = useState(true);
	const [offset, setOffset] = useState(0);

	const { theme } = useTheme();
	const isMasterDetail = useMasterDetail();
	const { bottom } = useSafeAreaInsets();
	const searchBarRef = useRef<SearchBarCommands>(null);

	const getRoomFromDb = async () => {
		const { rid } = route.params;
		const db = database.active;
		const subsCollection = db.get('subscriptions');
		try {
			const r = await subsCollection.find(rid);
			roomRef.current = r;
		} catch (error) {
			console.log('CannedResponsesListView: Room not found');
			log(error);
		}
	};

	const handleGetDepartments = useDebounce(async () => {
		try {
			const res = await getDepartments();
			if (res.success) {
				setDepartments([...fixedScopes, ...(res.departments as ILivechatDepartment[])]);
			}
		} catch (e) {
			setDepartments(fixedScopes);
			log(e);
		}
	}, 300);

	const goToDetail = (item: ICannedResponse) => {
		const room = roomRef.current;
		if (room) {
			navigation.navigate('CannedResponseDetail', { cannedResponse: item, room });
		}
	};

	const navigateToRoom = (item: ICannedResponse) => {
		const room = roomRef.current;
		if (room?.rid) {
			goRoom({ item: room, isMasterDetail, usedCannedResponse: item.text });
		}
	};

	const handleGetListCannedResponse = async ({
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
			const res = await getListCannedResponse({
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

	const getScopeName = (cannedResponse: ICannedResponse) => {
		if (cannedResponse.departmentId) {
			return departments.find(department => department._id === cannedResponse.departmentId)?.name || 'Department';
		}
		return departments.find(department => department._id === cannedResponse.scope)?.name ?? '';
	};

	const cannedResponsesScopeName: ICannedResponse[] = departments.length
		? cannedResponses.map(cannedResponse => ({ ...cannedResponse, scopeName: getScopeName(cannedResponse) }))
		: [];

	const searchCallback = useDebounce(async (text = '', department = '', depId = '') => {
		await handleGetListCannedResponse({ text, department, depId, debounced: true });
	}, 1000);

	useEffect(() => {
		getRoomFromDb();
		handleGetDepartments();
		handleGetListCannedResponse({ text: '', department: '', depId: '', debounced: false });
	}, []);

	const newSearch = () => {
		setCannedResponses([]);
		setLoading(true);
		setOffset(0);
	};

	const onChangeText = (text: string) => {
		newSearch();
		searchTextRef.current = text;
		searchCallback(text, scopeRef.current, departmentIdRef.current);
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
		scopeRef.current = department;
		departmentIdRef.current = depId;
		searchCallback(searchTextRef.current, department, depId);
		hideActionSheetRef();
	};

	const onEndReached = async () => {
		if (cannedResponses.length < offset || loading) {
			return;
		}
		setLoading(true);
		await handleGetListCannedResponse({
			text: searchTextRef.current,
			department: scopeRef.current,
			depId: departmentIdRef.current,
			debounced: false
		});
	};

	const showFilters = () => {
		showActionSheetRef({
			children: (
				<DepartmentFilter
					departments={departments}
					currentDepartment={currentDepartment}
					onDepartmentSelected={onDepartmentSelect}
				/>
			),
			enableContentPanningGesture: false
		});
	};

	const onCancelSearch = () => {
		onChangeText('');
		setIsSearching(false);
	};

	const getHeader = (): NativeStackNavigationOptions =>
		searchHeaderOptions({
			isSearching,
			searchBarRef,
			onSearchPress: () => setIsSearching(true),
			onChangeText,
			onCancel: onCancelSearch,
			testIDPrefix: 'canned-responses-view',
			options: { headerLeft: () => null, headerTitle: I18n.t('Canned_Responses') },
			rightActions: [{ label: I18n.t('Filter'), icon: 'filter', onPress: showFilters }]
		});

	const setHeader = () => {
		const options = getHeader();
		navigation.setOptions(options);
	};

	useEffect(() => {
		setHeader();
	}, [isSearching, departments, currentDepartment]);

	const renderContent = () => {
		if (!cannedResponsesScopeName.length && !loading) {
			return <BackgroundContainer text={I18n.t('No_canned_responses')} />;
		}
		return (
			<FlatList
				data={cannedResponsesScopeName}
				extraData={cannedResponsesScopeName}
				style={[styles.list, { backgroundColor: themes[theme].surfaceRoom }]}
				contentContainerStyle={{ paddingBottom: bottom }}
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
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
				ItemSeparatorComponent={List.Separator}
				ListFooterComponent={loading ? <ActivityIndicator /> : null}
			/>
		);
	};

	return <SafeAreaView>{renderContent()}</SafeAreaView>;
};

export default CannedResponsesListView;
