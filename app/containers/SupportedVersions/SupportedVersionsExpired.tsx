import React from 'react';
import { View, Text, Linking } from 'react-native';
import { useDispatch } from 'react-redux';

import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks';
import { getServerById } from '../../lib/database/services/Server';
import log from '../../lib/methods/helpers/log';
import database from '../../lib/database';
import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';
import { LEARN_MORE_URL } from './constants';
import { selectServerRequest } from '../../actions/server';

export const SupportedVersionsExpired = () => {
	const { colors } = useTheme();
	const { name, server } = useAppSelector(state => state.server);
	const dispatch = useDispatch();

	const checkAgain = async () => {
		try {
			const serversDB = database.servers;
			const serverRecord = await getServerById(server);
			if (serverRecord) {
				await serversDB.write(async () => {
					await serverRecord.update(r => {
						r.supportedVersionsUpdatedAt = null;
						r.supportedVersionsWarningAt = null;
					});
				});
				dispatch(selectServerRequest(server));
			}
		} catch (e) {
			log(e);
		}
	};

	return (
		<View style={[styles.container, { paddingTop: 120, backgroundColor: colors.focusedBackground }]}>
			<View style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			<Text style={[styles.title, { color: colors.titleText }]}>
				{I18n.t('Supported_versions_expired_title', { workspace_name: name })}
			</Text>
			<Text style={[styles.description, { color: colors.bodyText }]}>{I18n.t('Supported_versions_expired_description')}</Text>
			<Button title={I18n.t('Check_again')} type='primary' onPress={checkAgain} />
			<Button
				title={I18n.t('Learn_more')}
				type='secondary'
				backgroundColor={colors.chatComponentBackground}
				onPress={() => Linking.openURL(LEARN_MORE_URL)}
			/>
		</View>
	);
};
