import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import I18n from '../../i18n';

import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { useTheme } from '../../theme';
import HeaderCanned from './HeaderCanned';
import CannedResponseItem from './CannedResponseItem';
import RocketChat from '../../lib/rocketchat';
import debounce from '../../utils/debounce';
import Navigation from '../../lib/Navigation';

const COUNT = 25;

const CannedResponsesListView = ({ navigation, route }) => {
	const [cannedResponses, setCannedResponses] = useState([]);
	const [searchText, setSearchText] = useState('');
	const [scope, setScope] = useState('');
	const [departmentId, setDepartmentId] = useState('');
	const [loading, setLoading] = useState(true);
	const [offset, setOffset] = useState(0);

	const { theme } = useTheme();
	const { isMasterDetail } = useSelector(state => state.app);
	const { rooms } = useSelector(state => state.room);

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Canned_Responses')
		});
	}, []);

	const goRoom = (item) => {
		const { room } = route.params;
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

	const getListCannedResponse = async(text, department, depId, debounced) => {
		try {
			const res = await RocketChat.getListCannedResponse({
				text,
				offset,
				count: COUNT,
				departmentId: depId,
				scope: department
			});
			if (res.success) {
				setCannedResponses(prevCanned => (
					debounced
						? res.cannedResponses
						: [...prevCanned, ...res.cannedResponses]
				));
				setLoading(false);
				setOffset(prevOffset => prevOffset + COUNT);
			}
		} catch (e) {
			// do nothing
		}
	};

	const searchCallback = useCallback(debounce(async(text = '', department = '', depId = '') => {
		await getListCannedResponse(text, department, depId, true);
	}, 1000), []); // use debounce with useCallback https://stackoverflow.com/a/58594890

	useEffect(() => {
		getListCannedResponse();
	}, []);

	const newSearch = () => {
		setCannedResponses([]);
		setLoading(true);
		setOffset(0);
	};

	const onChangeText = (text) => {
		newSearch();
		setSearchText(text);
		searchCallback(text, scope, departmentId);
	};

	const onDepartmentSelect = ({ value }) => {
		let department = '';
		let depId = '';

		if (value._id === 'all') {
			department = '';
		} else if (value._id === 'public') {
			department = 'global';
		} else if (value._id === 'private') {
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

	const onEndReached = async() => {
		if (cannedResponses.length < offset || loading) {
			return;
		}
		setLoading(true);
		await getListCannedResponse(searchText, scope, departmentId);
	};

	return (
		<SafeAreaView>
			<StatusBar />

			<HeaderCanned theme={theme} onChangeText={onChangeText} onDepartmentSelect={onDepartmentSelect} />
			<FlatList
				data={cannedResponses}
				extraData={cannedResponses}
				renderItem={({ item }) => (
					<CannedResponseItem
						theme={theme}
						scope={item.scope}
						shortcut={item.shortcut}
						tags={item?.tags}
						text={item.text}
						onPressDetail={() => console.log('🏎️', cannedResponses, offset)}
						onPressUse={() => goRoom(item)}
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
