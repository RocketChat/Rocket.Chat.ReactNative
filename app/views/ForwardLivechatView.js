import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, ScrollView } from 'react-native';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import RocketChat from '../lib/rocketchat';
import ListItem from '../containers/ListItem';
import OnboardingSeparator from '../containers/OnboardingSeparator';
import { showErrorAlert } from '../utils/info';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	content: {
		marginVertical: 10
	}
});

const ForwardLivechatView = ({ navigation, theme }) => {
	const [departments, setDepartments] = useState([]);
	const [departmentId, setDepartment] = useState();
	const [users, setUsers] = useState([]);
	const [userId, setUser] = useState();
	const [room, setRoom] = useState({});

	const rid = navigation.getParam('rid');

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

	const submit = async() => {
		const transferData = { roomId: rid };

		if (!departmentId && !userId) {
			return;
		}

		if (userId) {
			transferData.userId = userId;
		} else {
			transferData.departmentId = departmentId;
		}

		const { error, result } = await RocketChat.forwardLivechat(transferData);
		if (error) {
			showErrorAlert(error, I18n.t('Oops'));
		} else if (result) {
			// forward successfully
		} else {
			showErrorAlert(I18n.t('No_available_agents_to_transfer'), I18n.t('Oops'));
		}
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

	const onPressDepartment = (title) => {
		navigation.navigate('PickerView', {
			title,
			value: 1,
			data: departments,
			onChangeValue: setDepartment
		});
	};

	const onPressUser = (title) => {
		navigation.navigate('PickerView', {
			title,
			data: users,
			onChangeValue: setUser,
			onChangeText: getUsers
		});
	};

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
			<ScrollView style={styles.content}>
				<ListItem
					title={I18n.t('Forward_to_department')}
					onPress={title => onPressDepartment(title)}
					theme={theme}
				/>
				<OnboardingSeparator theme={theme} />
				<ListItem
					title={I18n.t('Forward_to_user')}
					onPress={title => onPressUser(title, true)}
					theme={theme}
				/>
			</ScrollView>
		</View>
	);
};
ForwardLivechatView.propTypes = {
	navigation: PropTypes.object,
	theme: PropTypes.string
};
ForwardLivechatView.navigationOptions = {
	title: I18n.t('Forward_Chat')
};

export default withTheme(ForwardLivechatView);
