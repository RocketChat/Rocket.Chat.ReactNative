import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import UAParser from 'ua-parser-js';

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

const Livechat = ({ rid, navigation, theme }) => {
	const [user, setUser] = useState({});
	const [room, setRoom] = useState({});
	const [department, setDepartment] = useState({});

	const getVisitor = async(id) => {
		if (id) {
			const result = await RocketChat.getVisitorInfo(id);
			if (result.success) {
				const { visitor } = result;

				if (visitor.userAgent) {
					const ua = new UAParser();
					ua.setUA(visitor.userAgent);
					visitor.os = `${ ua.getOS().name } ${ ua.getOS().version }`;
					visitor.browser = `${ ua.getBrowser().name } ${ ua.getBrowser().version }`;
				}

				setUser(visitor);
				navigation.setParams({ visitor });
			}
		}
	};

	const getDepartment = async(id) => {
		if (id) {
			const result = await RocketChat.getDepartmentInfo(id);
			if (result.success) {
				setDepartment(result.department);
			}
		}
	};

	const getRoom = async() => {
		try {
			const result = await RocketChat.getRoomInfo(rid);
			if (result.success) {
				setRoom(result.room);
				navigation.setParams({ livechat: result.room });
				getVisitor(result.room.v._id);
				getDepartment(result.room.departmentId);
			}
		} catch {
			// do nothing
		}
	};

	useEffect(() => { getRoom(); }, []);

	return (
		<>
			<Title
				title={I18n.t('User')}
				theme={theme}
			/>
			<Timezone
				utcOffset={user.utc}
				theme={theme}
			/>
			<Item
				label={I18n.t('Email')}
				content={user.visitorEmails?.map(email => email.address).reduce((ret, item) => `${ ret }${ item }\n`)}
				theme={theme}
			/>
			<Item
				label={I18n.t('Phone')}
				content={user.phone?.map(phone => phone.phoneNumber).reduce((ret, item) => `${ ret }${ item }\n`)}
				theme={theme}
			/>
			<Item
				label={I18n.t('IP')}
				content={user.ip}
				theme={theme}
			/>
			<Item
				label={I18n.t('OS')}
				content={user.os}
				theme={theme}
			/>
			<Item
				label={I18n.t('Browser')}
				content={user.browser}
				theme={theme}
			/>
			<CustomFields
				customFields={user.livechatData}
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
	rid: PropTypes.string,
	navigation: PropTypes.object,
	theme: PropTypes.string
};

export default withTheme(Livechat);
