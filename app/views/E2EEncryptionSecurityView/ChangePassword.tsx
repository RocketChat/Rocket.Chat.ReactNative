import React, { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { FormTextInput } from '../../containers/TextInput';
import Button from '../../containers/Button';
import { Encryption } from '../../lib/encryption';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { styles } from './styles';
import { generatePassphrase } from '../../lib/encryption/utils';
import * as List from '../../containers/List';
import PasswordPolicies from '../../containers/PasswordPolicies';
import { E2E_PASSWORD_POLICIES, validateE2EPassword } from './utils';

const ChangePassword = () => {
	const [newPassword, setNewPassword] = useState('');
	const [manualPasswordEnabled, setManualPasswordEnabled] = useState(false);
	const { colors } = useTheme();
	const { encryptionEnabled, server } = useAppSelector(state => ({
		encryptionEnabled: state.encryption.enabled,
		server: state.server.server
	}));
	const newPasswordInputRef = useRef<TextInput | null>(null);

	const onChangePasswordText = (text: string) => setNewPassword(text);

	const isPasswordValid = manualPasswordEnabled ? validateE2EPassword(newPassword) : !!newPassword.trim();

	const changePassword = () => {
		if (!newPassword.trim()) {
			return;
		}
		showConfirmationAlert({
			title: I18n.t('Are_you_sure_question_mark'),
			message: I18n.t('E2E_encryption_change_password_message'),
			confirmationText: I18n.t('E2E_encryption_change_password_confirmation'),
			onPress: async () => {
				logEvent(events.E2E_SEC_CHANGE_PASSWORD);
				try {
					await Encryption.changePassword(server, newPassword);
					EventEmitter.emit(LISTENER, { message: I18n.t('E2E_encryption_change_password_success') });
					newPasswordInputRef?.current?.clear();
					newPasswordInputRef?.current?.blur();
				} catch (e) {
					log(e);
					showErrorAlert(I18n.t('E2E_encryption_change_password_error'));
				}
			}
		});
	};

	const enterManually = () => {
		setManualPasswordEnabled(true);
		setNewPassword('');
		setTimeout(() => {
			newPasswordInputRef?.current?.focus();
		}, 100);
	};

	const generateNewPassword = async () => {
		setManualPasswordEnabled(false);
		const password = await generatePassphrase();
		setNewPassword(password);
	};

	const copy = () => {
		logEvent(events.E2E_SEC_COPY_PASSWORD);
		if (newPassword) {
			Clipboard.setString(newPassword);
			EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
		}
	};

	if (!encryptionEnabled) {
		return null;
	}

	return (
		<View style={{ gap: 8 }}>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('E2E_encryption_change_password_title')}</Text>
			<Text style={[styles.description, { color: colors.fontDefault }]}>
				{I18n.t('E2E_encryption_change_password_description')}
			</Text>
			<FormTextInput
				inputRef={newPasswordInputRef}
				placeholder={I18n.t('New_Password')}
				returnKeyType='send'
				onSubmitEditing={changePassword}
				testID='e2e-encryption-security-view-password'
				onChangeText={onChangePasswordText}
				value={newPassword}
				editable={manualPasswordEnabled}
				multiline={!manualPasswordEnabled}
				secureTextEntry={manualPasswordEnabled}
			/>
			{manualPasswordEnabled ? (
				<PasswordPolicies isDirty={!!newPassword} password={newPassword} policies={E2E_PASSWORD_POLICIES} />
			) : null}
			<View style={{ gap: 4 }}>
				{!manualPasswordEnabled && newPassword ? (
					<Button onPress={copy} title={I18n.t('Copy')} type='secondary' fontSize={12} small />
				) : null}
				<Button
					onPress={enterManually}
					title={I18n.t('Enter_manually')}
					style={styles.changePasswordButton}
					testID='e2e-encryption-security-view-change-password'
					type='secondary'
				/>
				<Button
					onPress={generateNewPassword}
					title={I18n.t('Generate_new_password')}
					style={styles.changePasswordButton}
					testID='e2e-encryption-security-view-change-password'
				/>
				<Button
					onPress={changePassword}
					title={I18n.t('Save_Changes')}
					disabled={!isPasswordValid}
					style={styles.changePasswordButton}
					testID='e2e-encryption-security-view-change-password'
				/>
			</View>
			<List.Separator style={styles.separator} />
		</View>
	);
};

export default ChangePassword;
