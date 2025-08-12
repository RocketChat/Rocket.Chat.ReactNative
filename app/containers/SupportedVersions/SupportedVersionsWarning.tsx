import React, { ReactElement, useLayoutEffect } from 'react';
import { View, Text, Linking } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';
import { useSupportedVersionMessage } from './useSupportedVersionMessage';
import * as HeaderButton from '../Header/components/HeaderButton';
import i18n from '../../i18n';
import { LEARN_MORE_URL } from './constants';

export const SupportedVersionsWarning = ({ navigation, route }: { navigation?: any; route?: any }): ReactElement | null => {
	const { colors } = useTheme();
	const message = useSupportedVersionMessage();

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: i18n.t('Supported_versions_warning_update_required')
		});

		if (route?.params?.showCloseButton) {
			navigation?.setOptions({
				headerLeft: () => <HeaderButton.CloseModal />
			});
		}
	}, [navigation, route]);

	if (!message) {
		return null;
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
			<View accessible accessibilityLabel={i18n.t('Attention')} style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.buttonBackgroundDangerDefault} />
			</View>
			{message.title ? (
				<Text testID='sv-warn-title' style={[styles.title, { color: colors.fontTitlesLabels }]}>
					{message.title}
				</Text>
			) : null}
			{message.subtitle ? (
				<Text testID='sv-warn-subtitle' style={[styles.subtitle, { color: colors.fontDefault }]}>
					{message.subtitle}
				</Text>
			) : null}
			{message.description ? (
				<Text testID='sv-warn-description' style={[styles.description, { color: colors.fontDefault }]}>
					{message.description}
				</Text>
			) : null}
			<Button
				testID='sv-warn-button'
				title={i18n.t('Learn_more')}
				type='secondary'
				backgroundColor={colors.surfaceTint}
				onPress={() => Linking.openURL(message.link || LEARN_MORE_URL)}
			/>
		</View>
	);
};
