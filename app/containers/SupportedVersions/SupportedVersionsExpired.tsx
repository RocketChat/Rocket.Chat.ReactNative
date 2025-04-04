import React, { useState } from 'react';
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

const checkAgainTimeout = 3000;

export const SupportedVersionsExpired = () => {
	const { colors } = useTheme();
	const [checking, setChecking] = useState(false);
	const { name, server } = useAppSelector(state => state.server);
	const dispatch = useDispatch();

	const checkAgain = async () => {
		try {
			setChecking(true);
			const serversDB = database.servers;
			const serverRecord = await getServerById(server);
			if (serverRecord) {
				await serversDB.write(async () => {
					await serverRecord.update(r => {
						r.supportedVersionsUpdatedAt = null;
						r.supportedVersionsWarningAt = null;
					});
				});
				dispatch(selectServerRequest(server, serverRecord.version));
				// forces loading state a little longer until redux is finished
				await new Promise(res => setTimeout(res, checkAgainTimeout));
			}
		} catch (e) {
			log(e);
		} finally {
			setChecking(false);
		}
	};

	return (
		<View style={[styles.container, { paddingTop: 120, backgroundColor: colors.surfaceLight }]}>
			<View style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.buttonBackgroundDangerDefault} />
			</View>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>
				{I18n.t('Supported_versions_expired_title', { workspace_name: name })}
			</Text>
			<Text style={[styles.description, { color: colors.fontDefault }]}>{I18n.t('Supported_versions_expired_description')}</Text>
			<Button title={I18n.t('Check_again')} type='primary' onPress={checkAgain} loading={checking} />
			<Button
				title={I18n.t('Learn_more')}
				type='secondary'
				backgroundColor={colors.surfaceTint}
				onPress={() => Linking.openURL(LEARN_MORE_URL)}
			/>
		</View>
	);
};
