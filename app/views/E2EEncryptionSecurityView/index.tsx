import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import { e2eResetOwnKey } from 'lib/services/restApi';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import Button from '../../containers/Button';
import { PADDING_HORIZONTAL } from '../../containers/List/constants';
import { type SettingsStackParamList } from '../../stacks/types';
import ChangePassword from './ChangePassword';
import sharedStyles from '../Styles';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { logout } from '../../actions/login';

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: PADDING_HORIZONTAL
	},
	content: {
		gap: 32
	},
	info: {
		fontSize: 16,
		lineHeight: 24,
		marginTop: 24,
		...sharedStyles.textRegular
	}
});

const E2EEncryptionSecurityView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'E2EEncryptionSecurityView'>>();
	const { colors } = useTheme();
	const dispatch = useDispatch();

	const resetE2EEPassword = () => {
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

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('E2E_Encryption')
		});
	}, [navigation]);

	const cancel = () => {
		navigation.getParent()?.goBack();
	};

	return (
		<SafeAreaView testID='e2e-encryption-security-view' style={{ backgroundColor: colors.surfaceRoom }}>
			<List.Container>
				<View style={styles.container}>
					<ChangePassword />

					<List.Section>
						<View style={styles.content}>
							<Text style={[styles.info, { color: colors.fontDefault }]}>{I18n.t('Enter_E2EE_Password_description')}</Text>
							<View>
								<Button
									onPress={resetE2EEPassword}
									title={I18n.t('Reset_E2EE_Password')}
									testID='e2e-reset-your-password-view-reset-password'
								/>
								<Button type='secondary' onPress={cancel} title={I18n.t('Cancel')} testID='e2e-reset-your-password-view-cancel' />
							</View>
						</View>
					</List.Section>
				</View>
			</List.Container>
		</SafeAreaView>
	);
};

export default E2EEncryptionSecurityView;
