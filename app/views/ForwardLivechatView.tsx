import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { forwardRoom, ITransferData } from '../actions/room';
import OrSeparator from '../containers/OrSeparator';
import Input from '../containers/UIKit/MultiSelect/Input';
import { IBaseScreen, IServerRoom } from '../definitions';
import I18n from '../i18n';
import { ChatsStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { IOptionsField } from './NotificationPreferencesView/options';
import { Services } from '../lib/services';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	}
});

interface IParsedData {
	label: string;
	value: string;
}

const COUNT_DEPARTMENT = 50;

const ForwardLivechatView = ({ navigation, route }: IBaseScreen<ChatsStackParamList, 'ForwardLivechatView'>) => {
	const [departments, setDepartments] = useState<IParsedData[]>([]);
	const [departmentId, setDepartment] = useState('');
	const [departmentTotal, setDepartmentTotal] = useState(0);
	const [users, setUsers] = useState<IOptionsField[]>([]);
	const [userId, setUser] = useState();
	const [room, setRoom] = useState({} as IServerRoom);
	const dispatch = useDispatch();
	const { theme, colors } = useTheme();

	const rid = route.params?.rid;

	const getDepartments = async (text = '', offset = 0) => {
		try {
			const result = await Services.getDepartments({ count: COUNT_DEPARTMENT, text, offset });
			if (result.success) {
				const parsedDepartments = result.departments.map(department => ({
					label: department.name,
					value: department._id
				}));
				if (!text && !offset) {
					setDepartments(parsedDepartments);
					setDepartmentTotal(result?.total);
				}
				return { data: parsedDepartments, total: result?.total, offset: result?.offset };
			}
		} catch {
			// do nothing
		}
	};

	const getUsers = async (term = '') => {
		try {
			const { servedBy: { _id: agentId } = {} } = room;
			const _id = agentId && { $ne: agentId };
			const result = await Services.usersAutoComplete({
				conditions: { _id, status: { $ne: 'offline' }, statusLivechat: 'available' },
				term
			});
			if (result.success) {
				const parsedUsers = result.items.map(user => ({ label: user.username, value: user._id }));
				if (!term) {
					setUsers(parsedUsers);
				}
				return { data: parsedUsers };
			}
		} catch {
			// do nothing
		}
	};

	const getRoom = async () => {
		try {
			const result = await Services.getRoomInfo(rid);
			if (result.success) {
				setRoom(result.room as IServerRoom);
			}
		} catch {
			// do nothing
		}
	};

	const submit = () => {
		const transferData: ITransferData = { roomId: rid };

		if (!departmentId && !userId) {
			return;
		}

		if (userId) {
			transferData.userId = userId;
		} else {
			transferData.departmentId = departmentId;
		}

		dispatch(forwardRoom(rid, transferData));
	};

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Forward_Chat')
		});
		getRoom();
	}, []);

	useEffect(() => {
		if (!isEmpty(room)) {
			getUsers();
			getDepartments();
		}
	}, [room]);

	useEffect(() => {
		if (departmentId || userId) {
			submit();
		}
	}, [departmentId, userId]);

	const onPressDepartment = () => {
		navigation.navigate('PickerView', {
			title: I18n.t('Forward_to_department'),
			value: room?.departmentId,
			data: departments,
			onChangeValue: setDepartment,
			onSearch: getDepartments,
			onEndReached: getDepartments,
			total: departmentTotal,
			goBack: false
		});
	};

	const onPressUser = () => {
		navigation.navigate('PickerView', {
			title: I18n.t('Forward_to_user'),
			data: users,
			onChangeValue: setUser,
			onSearch: getUsers,
			goBack: false
		});
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.auxiliaryBackground }]}>
			<Input onPress={onPressDepartment} placeholder={I18n.t('Select_a_Department')} theme={theme} />
			<OrSeparator theme={theme} />
			<Input onPress={onPressUser} placeholder={I18n.t('Select_a_User')} theme={theme} />
		</View>
	);
};

export default ForwardLivechatView;
