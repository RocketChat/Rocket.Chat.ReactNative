import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import RocketChat from '../../lib/rocketchat';
import { TSupportedThemes, useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { themes } from '../../lib/constants';
import I18n from '../../i18n';
import { ISubscription } from '../../definitions';
import { ILivechatVisitorModified } from './index';
import CustomFields from './CustomFields';
import Item from './Item';
import Timezone from './Timezone';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		paddingHorizontal: 20,
		...sharedStyles.textMedium
	}
});

const Title = ({ title, theme }: { title: string; theme: TSupportedThemes }) => (
	<Text style={[styles.title, { color: themes[theme].titleText }]}>{title}</Text>
);

const Livechat = ({ room, roomUser }: { room: ISubscription; roomUser: ILivechatVisitorModified }) => {
	const [department, setDepartment] = useState<ILivechatDepartment>({} as ILivechatDepartment);
	const { theme } = useTheme();

	const getDepartment = async (id: string) => {
		if (id) {
			const result = await RocketChat.getDepartmentInfo(id);
			if (result.success) {
				setDepartment(result.department as ILivechatDepartment);
			}
		}
	};

	const getRoom = () => {
		if (room.departmentId) {
			getDepartment(room.departmentId);
		}
	};

	useEffect(() => {
		getRoom();
	}, [room]);

	return (
		<>
			<Title title={I18n.t('User')} theme={theme} />
			<Timezone utcOffset={roomUser.utc} />
			<Item label={I18n.t('Username')} content={roomUser.username} />
			<Item
				label={I18n.t('Email')}
				content={roomUser.visitorEmails?.map(email => email.address).reduce((ret, item) => `${ret}${item}\n`)}
			/>
			<Item
				label={I18n.t('Phone')}
				content={roomUser.phone?.map(phone => phone.phoneNumber).reduce((ret, item) => `${ret}${item}\n`)}
			/>
			<Item label={I18n.t('IP')} content={roomUser.ip} />
			<Item label={I18n.t('OS')} content={roomUser.os} />
			<Item label={I18n.t('Browser')} content={roomUser.browser} />
			<CustomFields customFields={roomUser.livechatData} />
			<Title title={I18n.t('Conversation')} theme={theme} />
			<Item label={I18n.t('Agent')} content={room.servedBy?.username} />
			{/* TODO: Will be deprecated */}
			{/* @ts-ignore */}
			<Item label={I18n.t('Facebook')} content={room.facebook?.page.name} />
			{/* TODO: Will be deprecated */}
			{/* @ts-ignore */}
			<Item label={I18n.t('SMS')} content={room.sms && 'SMS Enabled'} />
			<Item label={I18n.t('Topic')} content={room.topic} />
			<Item label={I18n.t('Tags')} content={room.tags?.join(', ')} />
			<Item label={I18n.t('Department')} content={department.name} />
			<CustomFields customFields={room.livechatData} />
		</>
	);
};

export default Livechat;
