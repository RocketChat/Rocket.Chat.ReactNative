import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput as RNTextInput } from 'react-native';

import { useTheme } from '../../theme';
import * as List from '../../containers/List';
import I18n from '../../i18n';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { FormTextInput } from '../../containers/TextInput';
import Button from '../../containers/Button';
import { Encryption } from '../../lib/encryption';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import { useDebounce } from '../../lib/methods/helpers';
import sharedStyles from '../Styles';
import { useAppSelector } from '../../lib/hooks';

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	description: {
		fontSize: 14,
		paddingVertical: 12,
		...sharedStyles.textRegular
	},
	changePasswordButton: {
		marginBottom: 4
	},
	separator: {
		marginBottom: 16
	}
});

const ChangePassword = () => {
	const [newPassword, setNewPassword] = useState('');
	const { colors } = useTheme();
	const { encryptionEnabled, server } = useAppSelector(state => ({
		encryptionEnabled: state.encryption.enabled,
		server: state.server.server
	}));
	const newPasswordInputRef = useRef<RNTextInput | null>(null);

	const onChangePasswordText = useDebounce((text: string) => setNewPassword(text), 300);

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

	if (!encryptionEnabled) {
		return null;
	}

	return (
		<>
			<List.Section>
				<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('E2E_encryption_change_password_title')}</Text>
				<Text style={[styles.description, { color: colors.fontDefault }]}>
					{I18n.t('E2E_encryption_change_password_description')}
				</Text>
				<FormTextInput
					inputRef={newPasswordInputRef}
					placeholder={I18n.t('New_Password')}
					returnKeyType='send'
					secureTextEntry
					onSubmitEditing={changePassword}
					testID='e2e-encryption-security-view-password'
					onChangeText={onChangePasswordText}
				/>
				<Button
					onPress={changePassword}
					title={I18n.t('Save_Changes')}
					disabled={!newPassword.trim()}
					style={styles.changePasswordButton}
					testID='e2e-encryption-security-view-change-password'
				/>
			</List.Section>
			<List.Separator style={styles.separator} />
		</>
	);
};

export default ChangePassword;
