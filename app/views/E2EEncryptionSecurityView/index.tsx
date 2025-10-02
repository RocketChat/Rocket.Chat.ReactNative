import React, { useLayoutEffect } from 'react';
import { Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import Button from '../../containers/Button';
import { logout } from '../../actions/login';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import { e2eResetOwnKey } from '../../lib/services/restApi';
import { SettingsStackParamList } from '../../stacks/types';
import ChangePassword from './ChangePassword';
import { styles } from './styles';

const E2EEncryptionSecurityView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'E2EEncryptionSecurityView'>>();
	const { colors } = useTheme();
	const dispatch = useDispatch();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('E2E_Encryption')
		});
	}, [navigation]);

	const resetOwnKey = () => {
		showConfirmationAlert({
			title: I18n.t('Are_you_sure_question_mark'),
			message: I18n.t('E2E_encryption_reset_message'),
			confirmationText: I18n.t('E2E_encryption_reset_confirmation'),
			onPress: async () => {
				logEvent(events.E2E_SEC_RESET_OWN_KEY);
				try {
					const res = await e2eResetOwnKey();

					if (res?.success === true) {
						dispatch(logout());
					}
				} catch (e) {
					log(e);
					showErrorAlert(I18n.t('E2E_encryption_reset_error'));
				}
			}
		});
	};

	return (
		<SafeAreaView testID='e2e-encryption-security-view' style={{ backgroundColor: colors.surfaceRoom }}>
			<List.Container>
				<View style={styles.container}>
					<ChangePassword />

					<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('E2E_encryption_reset_title')}</Text>
					<Text style={[styles.description, { color: colors.fontDefault }]}>{I18n.t('E2E_encryption_reset_description')}</Text>
					<Button
						onPress={resetOwnKey}
						title={I18n.t('E2E_encryption_reset_button')}
						type='secondary'
						testID='e2e-encryption-security-view-reset-key'
						color={colors.buttonFontDanger}
						backgroundColor={colors.buttonBackgroundDangerDefault}
					/>
				</View>
			</List.Container>
		</SafeAreaView>
	);
};

export default E2EEncryptionSecurityView;
