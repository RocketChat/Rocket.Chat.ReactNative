import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import CustomFields from './CustomFields';
import Item from './Item';
import Timezone from './Timezone';
import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';
import I18n from '../../i18n';

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		paddingHorizontal: 20,
		...sharedStyles.textMedium
	}
});

const Title = ({ title, theme }) => <Text style={[styles.title, { color: themes[theme].titleText }]}>{title}</Text>;
Title.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

const Livechat = ({ room, roomUser, theme }) => {
	const [department, setDepartment] = useState({});


	const getDepartment = async(id) => {
		if (id) {
			const result = await RocketChat.getDepartmentInfo(id);
			if (result.success) {
				setDepartment(result.department);
			}
		}
	};

	const getRoom = () => {
		if (room.departmentId) {
			getDepartment(room.departmentId);
		}
	};

	useEffect(() => { getRoom(); }, [room]);

	return (
		<>
			<Title
				title={I18n.t('User')}
				theme={theme}
			/>
			<Timezone
				utcOffset={roomUser.utc}
				theme={theme}
			/>
			<Item
				label={I18n.t('Username')}
				content={roomUser.username}
				theme={theme}
			/>
			<Item
				label={I18n.t('Email')}
				content={roomUser.visitorEmails?.map(email => email.address).reduce((ret, item) => `${ ret }${ item }\n`)}
				theme={theme}
			/>
			<Item
				label={I18n.t('Phone')}
				content={roomUser.phone?.map(phone => phone.phoneNumber).reduce((ret, item) => `${ ret }${ item }\n`)}
				theme={theme}
			/>
			<Item
				label={I18n.t('IP')}
				content={roomUser.ip}
				theme={theme}
			/>
			<Item
				label={I18n.t('OS')}
				content={roomUser.os}
				theme={theme}
			/>
			<Item
				label={I18n.t('Browser')}
				content={roomUser.browser}
				theme={theme}
			/>
			<CustomFields
				customFields={roomUser.livechatData}
				theme={theme}
			/>
			<Title
				title={I18n.t('Conversation')}
				theme={theme}
			/>
			<Item
				label={I18n.t('Agent')}
				content={room.servedBy?.username}
				theme={theme}
			/>
			<Item
				label={I18n.t('Facebook')}
				content={room.facebook?.page.name}
				theme={theme}
			/>
			<Item
				label={I18n.t('SMS')}
				content={room.sms && 'SMS Enabled'}
				theme={theme}
			/>
			<Item
				label={I18n.t('Topic')}
				content={room.topic}
				theme={theme}
			/>
			<Item
				label={I18n.t('Tags')}
				content={room.tags?.join(', ')}
				theme={theme}
			/>
			<Item
				label={I18n.t('Department')}
				content={department.name}
				theme={theme}
			/>
			<CustomFields
				customFields={room.livechatData}
				theme={theme}
			/>
		</>
	);
};
Livechat.propTypes = {
	room: PropTypes.object,
	roomUser: PropTypes.object,
	theme: PropTypes.string
};

export default withTheme(Livechat);
