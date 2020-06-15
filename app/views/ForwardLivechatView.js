import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import RocketChat from '../lib/rocketchat';
import OrSeparator from '../containers/OrSeparator';
import Input from '../containers/UIKit/MultiSelect/Input';
import { forwardRoom as forwardRoomAction } from '../actions/room';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	}
});

const ForwardLivechatView = ({
	forwardRoom, navigation, route, theme
}) => {
	const [departments, setDepartments] = useState([]);
	const [departmentId, setDepartment] = useState();
	const [users, setUsers] = useState([]);
	const [userId, setUser] = useState();
	const [room, setRoom] = useState();

	const rid = route.params?.rid;

	const getDepartments = async() => {
		try {
			const result = await RocketChat.getDepartments();
			if (result.success) {
				setDepartments(result.departments.map(department => ({ label: department.name, value: department._id })));
			}
		} catch {
			// do nothing
		}
	};

	const getUsers = async(term = '') => {
		try {
			const { servedBy: { _id: agentId } = {} } = room;
			const _id = agentId && { $ne: agentId };
			const result = await RocketChat.usersAutoComplete({ conditions: { _id, status: { $ne: 'offline' }, statusLivechat: 'available' }, term });
			if (result.success) {
				const parsedUsers = result.items.map(user => ({ label: user.username, value: user._id }));
				setUsers(parsedUsers);
				return parsedUsers;
			}
		} catch {
			// do nothing
		}
		return [];
	};

	const getRoom = async() => {
		try {
			const result = await RocketChat.getRoomInfo(rid);
			if (result.success) {
				setRoom(result.room);
			}
		} catch {
			// do nothing
		}
	};

	const submit = () => {
		const transferData = { roomId: rid };

		if (!departmentId && !userId) {
			return;
		}

		if (userId) {
			transferData.userId = userId;
		} else {
			transferData.departmentId = departmentId;
		}

		forwardRoom(rid, transferData);
	};

	useEffect(() => {
		getRoom();
	}, []);

	useEffect(() => {
		if (room) {
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
			goBack: false
		});
	};

	const onPressUser = () => {
		navigation.navigate('PickerView', {
			title: I18n.t('Forward_to_user'),
			data: users,
			onChangeValue: setUser,
			onChangeText: getUsers,
			goBack: false
		});
	};

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
			<Input
				onPress={onPressDepartment}
				placeholder={I18n.t('Select_a_Department')}
				theme={theme}
			/>
			<OrSeparator theme={theme} />
			<Input
				onPress={onPressUser}
				placeholder={I18n.t('Select_a_User')}
				theme={theme}
			/>
		</View>
	);
};
ForwardLivechatView.propTypes = {
	forwardRoom: PropTypes.func,
	navigation: PropTypes.object,
	route: PropTypes.object,
	theme: PropTypes.string
};
ForwardLivechatView.navigationOptions = {
	title: I18n.t('Forward_Chat')
};

const mapDispatchToProps = dispatch => ({
	forwardRoom: (rid, transferData) => dispatch(forwardRoomAction(rid, transferData))
});

export default connect(null, mapDispatchToProps)(withTheme(ForwardLivechatView));
