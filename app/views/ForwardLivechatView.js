import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, ScrollView } from 'react-native';

import I18n from '../i18n';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import { SubmitButton } from '../containers/HeaderButton';
import RocketChat from '../lib/rocketchat';
import ListItem from '../containers/ListItem';
import OnboardingSeparator from '../containers/OnboardingSeparator';

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

	const rid = navigation.getParam('rid');

	const getDepartments = async() => {
		const result = await RocketChat.getDepartments();
		if (result.success) {
			setDepartments(result.departments.map(department => ({ label: department.name, value: department._id })));
		}
	};

	useEffect(() => {
		navigation.setParams({
			submit: async() => {
				const transferData = { roomId: rid };

				if (!departmentId) {
					return;
				}

				transferData.departmentId = departmentId;

				await RocketChat.forwardLivechat(transferData);
			}
		});

		getDepartments();
	}, []);

	const onPress = (title) => {
		navigation.navigate('PickerView', {
			title,
			data: departments,
			onChangeValue: setDepartment
		});
	};

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
			<ScrollView style={styles.content}>
				<ListItem
					title={I18n.t('Forward_to_department')}
					onPress={title => onPress(title)}
					theme={theme}
				/>
				<OnboardingSeparator theme={theme} />
				<ListItem
					title={I18n.t('Forward_to_user')}
					onPress={title => onPress(title)}
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
ForwardLivechatView.navigationOptions = ({ navigation }) => ({
	title: I18n.t('Forward_Chat'),
	headerRight: <SubmitButton onPress={navigation.getParam('submit', () => {})} />
});

export default withTheme(ForwardLivechatView);
