import { sha256 } from 'js-sha256';
import React, { useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { deleteAccount } from '../../../../actions/login';
import { useActionSheet } from '../../../../containers/ActionSheet';
import FooterButtons from '../../../../containers/ActionSheet/FooterButtons';
import { CustomIcon } from '../../../../containers/CustomIcon';
import FormTextInput from '../../../../containers/TextInput/FormTextInput';
import i18n from '../../../../i18n';
import { showErrorAlert } from '../../../../lib/methods/helpers';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { deleteOwnAccount } from '../../../../lib/services/restApi';
import { useTheme } from '../../../../theme';
import { getTranslations } from './getTranslations';
import styles from './styles';

const AlertHeader = ({ title = '', subTitle = '' }) => {
	const { colors } = useTheme();
	return (
		<>
			<View style={styles.titleContainer}>
				<CustomIcon name='warning' size={32} color={colors.dangerColor} />
				<Text style={[styles.titleContainerText, { color: colors.passcodePrimary }]}>{title}</Text>
			</View>
			<Text style={[styles.subTitleContainerText, { color: colors.passcodePrimary }]}>{subTitle}</Text>
		</>
	);
};

export function DeleteAccountActionSheetContent(): React.ReactElement {
	const [password, setPassword] = useState('');
	const { theme } = useTheme();
	const { hideActionSheet, showActionSheet } = useActionSheet();
	const dispatch = useDispatch();
	const insets = useSafeAreaInsets();
	const handleDeleteAccount = async () => {
		Keyboard.dismiss();
		try {
			await deleteOwnAccount(sha256(password));
			hideActionSheet();
		} catch (error: any) {
			hideActionSheet();
			if (error.data.errorType === 'user-last-owner') {
				const { shouldChangeOwner, shouldBeRemoved } = error.data.details;
				const { changeOwnerRooms, removedRooms } = getTranslations({ shouldChangeOwner, shouldBeRemoved });

				setTimeout(() => {
					showActionSheet({
						children: (
							<ConfirmDeleteAccountActionSheetContent
								changeOwnerRooms={changeOwnerRooms}
								removedRooms={removedRooms}
								password={sha256(password)}
							/>
						),
						headerHeight: 225 + insets.bottom
					});
				}, 250); // timeout for hide effect
			} else if (error.data.errorType === 'error-invalid-password') {
				logEvent(events.DELETE_OWN_ACCOUNT_F);
				showErrorAlert(i18n.t('error-invalid-password'));
			} else {
				logEvent(events.DELETE_OWN_ACCOUNT_F);
				showErrorAlert(i18n.t(error.data.details));
			}
			return;
		}
		dispatch(deleteAccount());
	};

	return (
		<View style={styles.container}>
			<AlertHeader
				title={i18n.t('Are_you_sure_you_want_to_delete_your_account')}
				subTitle={i18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
			/>
			<FormTextInput
				value={password}
				placeholder={i18n.t('Password')}
				onChangeText={value => setPassword(value)}
				onSubmitEditing={handleDeleteAccount}
				theme={theme}
				testID='room-info-edit-view-name'
				secureTextEntry
				inputStyle={{ borderWidth: 2 }}
				bottomSheet
			/>
			<FooterButtons
				cancelTitle={i18n.t('Cancel')}
				cancelAction={hideActionSheet}
				confirmTitle={i18n.t('Delete_Account')}
				confirmAction={handleDeleteAccount}
				disabled={!password}
			/>
		</View>
	);
}

function ConfirmDeleteAccountActionSheetContent({ changeOwnerRooms = '', removedRooms = '', password = '' }) {
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const dispatch = useDispatch();

	const handleDeleteAccount = async () => {
		hideActionSheet();
		await deleteOwnAccount(password, true);
		dispatch(deleteAccount());
	};

	return (
		<View style={styles.container}>
			<AlertHeader title={i18n.t('Are_you_sure_question_mark')} subTitle={i18n.t('Deleting_a_user_will_delete_all_messages')} />
			{!!changeOwnerRooms && (
				<Text style={{ ...styles.subTitleContainerText, color: colors.dangerColor }}>{changeOwnerRooms}</Text>
			)}
			{!!removedRooms && <Text style={{ ...styles.subTitleContainerText, color: colors.dangerColor }}>{removedRooms}</Text>}
			<FooterButtons
				cancelTitle={i18n.t('Cancel')}
				cancelAction={hideActionSheet}
				confirmTitle={i18n.t('Delete_Account_confirm')}
				confirmAction={handleDeleteAccount}
			/>
		</View>
	);
}
