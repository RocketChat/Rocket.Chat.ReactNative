import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';
import UAParser from 'ua-parser-js';

import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import CustomFields from './CustomFields';
import Item from './Item';
import Timezone from './Timezone';

const Livechat = ({ rid, theme }) => {
	const [user, setUser] = useState({});
	const [room, setRoom] = useState({});
	const [department, setDepartment] = useState({});

	const getVisitor = async(id) => {
		if (id) {
			const result = await RocketChat.getVisitorInfo(id);
			if (result.success) {
				const { visitor } = result;
				const ua = new UAParser();
				ua.setUA(visitor.userAgent);

				visitor.os = `${ ua.getOS().name } ${ ua.getOS().version }`;
				visitor.browser = `${ ua.getBrowser().name } ${ ua.getBrowser().version }`;

				setUser(visitor);
			}
		}
	};

	const getDepartment = async(id) => {
		if (id) {
			const result = await RocketChat.getDepartamentInfo(id);
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
			<Timezone
				utcOffset={user.utc}
				theme={theme}
			/>
			{user.visitorEmails?.map(email => (
				<Item
					label='email'
					content={email.address}
					theme={theme}
				/>
			))}
			{user.phone?.map(phone => (
				<Item
					label='phone'
					content={phone.phoneNumber}
					theme={theme}
				/>
			))}
			<Item
				label='created_at'
				content={user.lastLogin && user.createdAt}
				theme={theme}
			/>
			<Item
				label='last_login'
				content={user.lastLogin}
				theme={theme}
			/>
			<Item
				label='ip'
				content={user.ip}
				theme={theme}
			/>
			<Item
				label='os'
				content={user.os}
				theme={theme}
			/>
			<Item
				label='browser'
				content={user.browser}
				theme={theme}
			/>
			<CustomFields
				customFields={user.livechatData}
				theme={theme}
			/>
			<Text>Conversation</Text>
			<Item
				label='agent'
				content={room.servedBy?.username}
				theme={theme}
			/>
			<Item
				label='facebook'
				content={room.facebook?.page.name}
				theme={theme}
			/>
			<Item
				label='sms'
				content={room.sms && 'SMS Enabled'}
				theme={theme}
			/>
			<Item
				label='topic'
				content={room.topic}
				theme={theme}
			/>
			<Item
				label='tags'
				content={room.joinTags}
				theme={theme}
			/>
			<Item
				label='last_login'
				content={room.roomClosedDateTime}
				theme={theme}
			/>
			<Item
				label='department'
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
	theme: PropTypes.string
};

export default withTheme(Livechat);
