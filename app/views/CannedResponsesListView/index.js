import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { useTheme } from '../../theme';
import RocketChat from '../../lib/rocketchat';
import debounce from '../../utils/debounce';
import Navigation from '../../lib/Navigation';
import { goRoom } from '../../utils/goRoom';
import CannedResponseItem from './CannedResponseItem';
import HeaderCanned from './HeaderCanned';

const COUNT = 25;

const fixedScopes = [
	{
		_id: 'all',
		name: I18n.t('All')
	},
	{
		_id: 'public',
		name: I18n.t('Public')
	},
	{
		_id: 'user',
		name: I18n.t('Private')
	}
];

const CannedResponsesListView = ({ navigation, route }) => {
	const [cannedResponses, setCannedResponses] = useState([]);
	const [cannedResponsesScopeName, setCannedResponsesScopeName] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [scope, setScope] = useState('');
	const [departments, setDepartments] = useState([]);
	const [allDepartments, setAllDepartments] = useState([]);
	const [departmentId, setDepartmentId] = useState('');
	const [loading, setLoading] = useState(true);
	const [offset, setOffset] = useState(0);

	const { room } = route.params;

	const { theme } = useTheme();
	const { isMasterDetail } = useSelector(state => state.app);
	const { rooms } = useSelector(state => state.room);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Canned_Responses')
		});
	}, []);

	const getDepartments = debounce(async (keyword = '') => {
		try {
			const res = await RocketChat.getDepartments(keyword);
			const regExp = new RegExp(keyword, 'gi');
			const filterWithText = fixedScopes.filter(dep => regExp.test(dep.name));
			res.success ? setDepartments([...filterWithText, ...res.departments]) : setDepartments(filterWithText);

			if (res.success && !keyword) {
				setAllDepartments([...filterWithText, ...res.departments]);
			}
		} catch {
			// do nothing
		}
	}, 300);

	const goToDetail = item => {
		navigation.navigate('CannedResponseDetail', { cannedResponse: item, room });
	};

	const navigateToRoom = item => {
		const { name, username } = room;
		const params = {
			rid: room.rid,
			name: RocketChat.getRoomTitle({
				t: room.t,
				fname: name,
				name: username
			}),
			t: room.t,
			roomUserId: RocketChat.getUidDirectMessage(room),
			usedCannedResponse: item.text
		};

		if (room.rid) {
			// if it's on master detail layout, we close the modal and replace RoomView
			if (isMasterDetail) {
				Navigation.navigate('DrawerNavigator');
				goRoom({ item: params, isMasterDetail, usedCannedResponse: item.text });
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

	const getListCannedResponse = async (text, department, depId, debounced) => {
		try {
			const res = await RocketChat.getListCannedResponse({
				text,
				offset,
				count: COUNT,
				departmentId: depId,
				scope: department
			});
			if (res.success) {
				setCannedResponses(prevCanned => (debounced ? res.cannedResponses : [...prevCanned, ...res.cannedResponses]));
				setLoading(false);
				setOffset(prevOffset => prevOffset + COUNT);
			}
		} catch (e) {
			// do nothing
		}
	};

	useEffect(() => {
		if (allDepartments.length > 0) {
			const newCannedResponses = cannedResponses.map(cr => {
				let scopeName = '';

				if (cr?.departmentId) {
					scopeName = allDepartments.filter(dep => dep._id === cr.departmentId)[0]?.name;
				} else {
					scopeName = allDepartments.filter(dep => dep._id === cr.scope)[0]?.name;
				}
				cr.scopeName = scopeName;

				return cr;
			});
			setCannedResponsesScopeName(newCannedResponses);
		}
	}, [allDepartments, cannedResponses]);

	const searchCallback = useCallback(
		debounce(async (text = '', department = '', depId = '') => {
			await getListCannedResponse(text, department, depId, true);
		}, 1000),
		[]
	); // use debounce with useCallback https://stackoverflow.com/a/58594890

	useEffect(() => {
		getDepartments();
		getListCannedResponse();
	}, []);

	const newSearch = () => {
		setCannedResponses([]);
		setLoading(true);
		setOffset(0);
	};

	const onChangeText = text => {
		newSearch();
		setSearchText(text);
		searchCallback(text, scope, departmentId);
	};

	const onDepartmentSelect = ({ value }) => {
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
		setScope(department);
		setDepartmentId(depId);
		searchCallback(searchText, department, depId);
	};

	const onEndReached = async () => {
		if (cannedResponses.length < offset || loading) {
			return;
		}
		setLoading(true);
		await getListCannedResponse(searchText, scope, departmentId);
	};

	return (
		<SafeAreaView>
			<StatusBar />

			<HeaderCanned
				theme={theme}
				onChangeText={onChangeText}
				onDepartmentSelect={onDepartmentSelect}
				initial={{
					value: fixedScopes[0],
					text: fixedScopes[0].name
				}}
				departments={departments}
				getDepartments={getDepartments}
			/>

			<FlatList
				data={cannedResponsesScopeName}
				extraData={cannedResponsesScopeName}
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
				ListFooterComponent={loading ? <ActivityIndicator theme={theme} /> : null}
			/>
		</SafeAreaView>
	);
};

CannedResponsesListView.propTypes = {
	navigation: PropTypes.object,
	route: PropTypes.object
};

export default CannedResponsesListView;
