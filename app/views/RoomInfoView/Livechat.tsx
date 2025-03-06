import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ISubscription } from '../../definitions';
import { ILivechatDepartment } from '../../definitions/ILivechatDepartment';
import { ILivechatVisitorModified } from '../../definitions/ILivechatVisitor';
import I18n from '../../i18n';
import { Services } from '../../lib/services';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import CustomFields from './CustomFields';
import Item from './Item';
import Timezone from './Timezone';

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		paddingHorizontal: 20,
		...sharedStyles.textMedium
	}
});

const Title = ({ title }: { title: string }) => {
	const { colors } = useTheme();
	return <Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{title}</Text>;
};

const Livechat = ({ room, roomUser }: { room: ISubscription; roomUser: ILivechatVisitorModified }): React.ReactElement => {
	const [department, setDepartment] = useState<ILivechatDepartment>({} as ILivechatDepartment);

	const getDepartment = async (id: string) => {
		if (id) {
			const result = await Services.getDepartmentInfo(id);
			if (result.success) {
				setDepartment(result.department as ILivechatDepartment);
			}
		}
	};

	useEffect(() => {
		const getRoom = () => {
			if (room.departmentId) getDepartment(room.departmentId);
		};
		getRoom();
	}, [room.departmentId]);

	return (
		<>
			<Title title={I18n.t('User')} />
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
			<Title title={I18n.t('Conversation')} />
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
