import React from 'react';
import { View, Text, Linking } from 'react-native';

import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';

const LEARN_MORE_URL =
	'https://docs.rocket.chat/resources/rocket.chats-support-structure/enterprise-support-and-version-durability';

export const SupportedVersionsExpired = () => {
	const { colors } = useTheme();
	const { name } = useAppSelector(state => state.server);

	return (
		<View style={[styles.container, { paddingTop: 120 }]}>
			<View style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			<Text style={[styles.title, { color: colors.bodyText }]}>
				{I18n.t('Supported_versions_expired_title', { workspace_name: name })}
			</Text>
			<Text style={[styles.description, { color: colors.bodyText }]}>{I18n.t('Supported_versions_expired_description')}</Text>
			<Button
				title={I18n.t('Learn_more')}
				type='secondary'
				backgroundColor={colors.chatComponentBackground}
				onPress={() => Linking.openURL(LEARN_MORE_URL)}
			/>
		</View>
	);
};
