import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import useDeepCompareEffect from 'use-deep-compare-effect';
import PropTypes from 'prop-types';
import UAParser from 'ua-parser-js';
import _ from 'lodash';

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

const Livechat = ({ room, navigation, theme }) => {
	const [user, setUser] = useState({});
	const [department, setDepartment] = useState({});

	const getCustomFields = async() => {
		const result = await RocketChat.getCustomFields();
		if (result.success) {
			const { customFields } = result;

			const visitorCustomFields = customFields
				.filter(field => field.visibility !== 'hidden' && field.scope === 'visitor')
				.map(field => ({ [field._id]: user.livechatData[field._id] || '' }))
				.reduce((ret, field) => ({ [field]: field, ...ret }));

			const livechatCustomFields = customFields
				.filter(field => field.visibility !== 'hidden' && field.scope === 'room')
				.map(field => ({ [field._id]: room.livechatData[field._id] || '' }))
				.reduce((ret, field) => ({ [field]: field, ...ret }));

			navigation.setParams({ visitor: { ...user, livechatData: visitorCustomFields } });
			navigation.setParams({
				livechat: {
					_id: room.rid, topic: room.topic, tags: room.tags, livechatData: livechatCustomFields
				}
			});
		}
	};

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

	const getRoom = () => {
		getVisitor(room.visitor._id);
		getDepartment(room.departmentId);
	};

	useEffect(() => { getRoom(); }, []);
	useDeepCompareEffect(() => {
		if (!_.isEmpty(room)) {
			getRoom();
			if (!_.isEmpty(user)) {
				getCustomFields();
			}
		}
	}, [room, user]);

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
	room: PropTypes.object,
	navigation: PropTypes.object,
	theme: PropTypes.string
};

export default withTheme(Livechat);
