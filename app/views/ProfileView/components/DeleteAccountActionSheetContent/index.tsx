import { sha256 } from 'js-sha256';
import React from 'react';
import { Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';

import { deleteAccount } from '../../../../actions/login';
import { useActionSheet } from '../../../../containers/ActionSheet';
import ActionSheetContentWithInputAndSubmit from '../../../../containers/ActionSheet/ActionSheetContentWithInputAndSubmit';
import i18n from '../../../../i18n';
import { showErrorAlert } from '../../../../lib/methods/helpers';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { deleteOwnAccount } from '../../../../lib/services/restApi';
import { useTheme } from '../../../../theme';
import { getTranslations } from './getTranslations';
import AlertText from './AlertText';

export function DeleteAccountActionSheetContent(): React.ReactElement {
	const { hideActionSheet, showActionSheet } = useActionSheet();
	const dispatch = useDispatch();
	const { colors } = useTheme();

	const handleDeleteAccount = async (password: string) => {
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
						)
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
		<ActionSheetContentWithInputAndSubmit
			title={i18n.t('Are_you_sure_you_want_to_delete_your_account')}
			description={i18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
			onCancel={hideActionSheet}
			onSubmit={password => handleDeleteAccount(password as string)}
			placeholder={i18n.t('Password')}
			testID='profile-view-delete-account-sheet'
			iconName='warning'
			confirmTitle={i18n.t('Delete_Account')}
			confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
		/>
	);
}

function ConfirmDeleteAccountActionSheetContent({ changeOwnerRooms = '', removedRooms = '', password = '' }) {
	const { hideActionSheet } = useActionSheet();
	const dispatch = useDispatch();
	const { colors } = useTheme();
	const handleDeleteAccount = async () => {
		hideActionSheet();
		await deleteOwnAccount(password, true);
		dispatch(deleteAccount());
	};

	return (
		<ActionSheetContentWithInputAndSubmit
			title={i18n.t('Are_you_sure_question_mark')}
			iconName='warning'
			description={i18n.t('Deleting_a_user_will_delete_all_messages')}
			onCancel={hideActionSheet}
			onSubmit={handleDeleteAccount}
			testID='room-info-edit-view-name'
			confirmTitle={i18n.t('Delete_Account_confirm')}
			confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
			showInput={false}
			customText={
				<>
					{!!changeOwnerRooms && <AlertText text={changeOwnerRooms} style={{ marginTop: 24 }} />}
					{!!removedRooms && <AlertText text={removedRooms} style={{ marginBottom: 36 }} />}
				</>
			}
		/>
	);
}
