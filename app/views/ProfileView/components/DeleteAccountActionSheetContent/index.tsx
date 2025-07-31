import React from 'react';
import { AccessibilityInfo, Keyboard, StyleSheet, Text, View } from 'react-native';
import { sha256 } from 'js-sha256';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import i18n from '../../../../i18n';
import sharedStyles from '../../../Styles';
import FooterButtons from './FooterButtons';
import ConfirmDeleteAccountContent from './ConfirmDeleteAccountContent';
import { deleteOwnAccount } from '../../../../lib/services/restApi';
import { deleteAccount } from '../../../../actions/login';
import { CustomIcon } from '../../../../containers/CustomIcon';
import { isIOS } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import { ControlledFormTextInput } from '../../../../containers/TextInput';
import { useActionSheet } from '../../../../containers/ActionSheet/Provider';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { getTranslations } from './getTranslations';

const styles = StyleSheet.create({
	subtitleText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		lineHeight: 24
	},
	titleContainerText: {
		...sharedStyles.textBold,
		fontSize: 16,
		lineHeight: 24,
		paddingLeft: 12
	},
	titleContainer: {
		paddingRight: 80,
		marginBottom: 12,
		flexDirection: 'row',
		alignItems: 'center'
	},
	inputContainer: {
		marginTop: 12,
		marginBottom: 36
	}
});

const DeleteAccountActionSheetContent = (): React.ReactElement => {
	const { colors } = useTheme();
	const { hideActionSheet, showActionSheet } = useActionSheet();
	const dispatch = useDispatch();
	const {
		control,
		getValues,
		setError,
		formState: { errors }
	} = useForm({
		defaultValues: {
			password: ''
		}
	});

	const handleDeleteAccount = async () => {
		const { password } = getValues();
		Keyboard.dismiss();
		try {
			await deleteOwnAccount(sha256(password));
			hideActionSheet();
		} catch (error: any) {
			if (error.data.errorType === 'user-last-owner') {
				const { shouldChangeOwner, shouldBeRemoved } = error.data.details;
				const { changeOwnerRooms, removedRooms } = getTranslations({ shouldChangeOwner, shouldBeRemoved });
				hideActionSheet();
				setTimeout(() => {
					showActionSheet({
						children: (
							<ConfirmDeleteAccountContent changeOwnerRooms={changeOwnerRooms} password={password} removedRooms={removedRooms} />
						)
					});
				}, 250); // timeout for hide effect
			} else if (error.data.errorType === 'error-invalid-password') {
				logEvent(events.DELETE_OWN_ACCOUNT_F);
				setError('password', { message: i18n.t('error-invalid-password'), type: 'validate' });
				AccessibilityInfo.announceForAccessibility(i18n.t('error-invalid-password'));
			} else {
				logEvent(events.DELETE_OWN_ACCOUNT_F);
				setError('password', { message: i18n.t(error.data.details), type: 'validate' });
				AccessibilityInfo.announceForAccessibility(i18n.t(error.data.details));
			}
			return;
		}
		dispatch(deleteAccount());
	};

	return (
		<View style={sharedStyles.containerScrollView} testID='action-sheet-content-with-input-and-submit'>
			<View accessible accessibilityLabel={i18n.t('Are_you_sure_you_want_to_delete_your_account')} style={styles.titleContainer}>
				<CustomIcon name={'warning'} size={32} color={colors.buttonBackgroundDangerDefault} />
				<Text style={[styles.titleContainerText, { color: colors.fontDefault }]}>
					{i18n.t('Are_you_sure_you_want_to_delete_your_account')}
				</Text>
			</View>
			<Text style={[styles.subtitleText, { color: colors.fontTitlesLabels }]}>
				{i18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
			</Text>

			<ControlledFormTextInput
				control={control}
				name='password'
				onSubmitEditing={handleDeleteAccount}
				accessibilityLabel={i18n.t('Password')}
				autoComplete='password'
				testID='profile-view-delete-account-sheet-input'
				secureTextEntry
				bottomSheet={isIOS}
				containerStyle={styles.inputContainer}
				error={errors.password?.message}
			/>

			<FooterButtons
				confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
				cancelAction={hideActionSheet}
				confirmAction={handleDeleteAccount}
				cancelTitle={i18n.t('Cancel')}
				confirmTitle={i18n.t('Delete_Account')}
				testID={'profile-view-delete-account-sheet'}
			/>
		</View>
	);
};

export default DeleteAccountActionSheetContent;
