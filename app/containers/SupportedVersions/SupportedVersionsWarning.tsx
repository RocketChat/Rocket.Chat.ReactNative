import { useLayoutEffect, type ReactElement } from 'react';
import { View, Linking } from 'react-native';
import { PlainText } from '~/containers/PlainText';

import { useTheme } from '~/theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';
import { useSupportedVersionMessage } from './useSupportedVersionMessage';
import * as HeaderButton from '../Header/components/HeaderButton';
import I18n from '~/i18n';
import { LEARN_MORE_URL } from './constants';

export const SupportedVersionsWarning = ({ navigation, route }: { navigation?: any; route?: any }): ReactElement | null => {
	const { colors } = useTheme();
	const message = useSupportedVersionMessage();

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: I18n.t('Supported_versions_warning_update_required')
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
			<View accessible accessibilityLabel={I18n.t('Attention')} style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.buttonBackgroundDangerDefault} />
			</View>
			{message.title ? (
				<PlainText testID='sv-warn-title' style={[styles.title, { color: colors.fontTitlesLabels }]}>
					{message.title}
				</PlainText>
			) : null}
			{message.subtitle ? (
				<PlainText testID='sv-warn-subtitle' style={[styles.subtitle, { color: colors.fontDefault }]}>
					{message.subtitle}
				</PlainText>
			) : null}
			{message.description ? (
				<PlainText testID='sv-warn-description' style={[styles.description, { color: colors.fontDefault }]}>
					{message.description}
				</PlainText>
			) : null}
			<Button
				testID='sv-warn-button'
				title={I18n.t('Learn_more')}
				type='secondary'
				backgroundColor={colors.surfaceTint}
				onPress={() => Linking.openURL(message.link || LEARN_MORE_URL)}
			/>
		</View>
	);
};
