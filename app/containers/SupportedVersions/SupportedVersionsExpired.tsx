import React from 'react';
import { View, Text } from 'react-native';

import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks';
import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';

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
				onPress={() => alert('Go to docs!')}
			/>
		</View>
	);
};
