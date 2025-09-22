import React, { useLayoutEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { sha256 } from 'js-sha256';

import { twoFactor } from '../../lib/services/twoFactor';
import { ProfileStackParamList } from '../../stacks/types';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { useAppSelector } from '../../lib/hooks';
import { isAndroid, showErrorAlert } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import { TwoFactorMethods } from '../../definitions/ITotp';
import { saveUserProfileMethod, setUserPassword } from '../../lib/services/restApi';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { setUser } from '../../actions/login';
import { LISTENER } from '../../containers/Toast';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import I18n from '../../i18n';
import KeyboardView from '../../containers/KeyboardView';
import StatusBar from '../../containers/StatusBar';
import Button from '../../containers/Button';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import sharedStyles from '../Styles';
import PasswordPolicies from '../../containers/PasswordPolicies';
import useVerifyPassword from '../../lib/hooks/useVerifyPassword';
import EventEmitter from '../../lib/methods/helpers/events';
import useA11yErrorAnnouncement from '../../lib/hooks/useA11yErrorAnnouncement';
import handleSaveUserProfileError from '../../lib/methods/helpers/handleSaveUserProfileError';

const styles = StyleSheet.create({
	disabled: {
		opacity: 0.3
	},
	inputContainer: {
		marginBottom: 0,
		marginTop: 0
	},
	createNewPasswordTitle: {
		...sharedStyles.textBold,
		lineHeight: 36,
		fontSize: 24
	},
	containerScrollView: {
		paddingTop: 32,
		gap: 24
	}
});

const isFromRoute = (navigation: NativeStackNavigationProp<ProfileStackParamList, 'ChangePasswordView'>, routeName: string) =>
	navigation.getState()?.routes?.[0]?.name === routeName;

interface IChangePasswordViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'ChangePasswordView'>;
}

const ChangePasswordView = ({ navigation }: IChangePasswordViewProps) => {
	const dispatch = useDispatch();
	const { colors } = useTheme();
	const fromProfileView = isFromRoute(navigation, 'ProfileView');

	const validationSchema = yup.object().shape({
		currentPassword: yup.string().required(`${I18n.t('Field_is_required', { field: I18n.t('Current_password') })}`),
		newPassword: yup.string().required(`${I18n.t('Field_is_required', { field: I18n.t('New_Password') })}`),
		confirmNewPassword: yup
			.string()
			.required()
			.oneOf([yup.ref('password'), null], I18n.t('Passwords_do_not_match'))
			.required(I18n.t('Field_is_required', { field: I18n.t('Confirm_password') }))
	});

	const { Accounts_AllowPasswordChange, Accounts_RequirePasswordConfirmation, serverURL, user } = useAppSelector(state => ({
		Accounts_AllowPasswordChange: state.settings.Accounts_AllowPasswordChange as boolean,
		Accounts_RequirePasswordConfirmation: state.settings.Accounts_RequirePasswordConfirmation as boolean,
		serverURL: state.server.server,
		user: getUserSelector(state)
	}));
	const [twoFactorCode, setTwoFactorCode] = useState<{ twoFactorCode: string; twoFactorMethod: TwoFactorMethods } | null>(null);

	const {
		control,
		watch,
		setValue,
		setError,
		formState: { isDirty, errors }
	} = useForm({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
			saving: false
		},
		resolver: yupResolver(validationSchema)
	});
	const inputValues = watch();
	const { isPasswordValid, passwordPolicies } = useVerifyPassword(inputValues?.newPassword, inputValues?.confirmNewPassword);

	const onCancel = () => {
		navigation.goBack();
	};

	const changePassword = async () => {
		const { newPassword } = inputValues;

		try {
			setValue('saving', true);
			await setUserPassword(newPassword);
			dispatch(setUser({ requirePasswordChange: false }));
			navigation.goBack();
		} catch (error: any) {
			showErrorAlert(error?.reason || error?.message, I18n.t('Oops'));
		} finally {
			setValue('saving', false);
		}
	};

	const changePasswordFromProfileView = async () => {
		const { currentPassword, newPassword, confirmNewPassword } = inputValues;
		if (newPassword !== confirmNewPassword) {
			setError('newPassword', { message: 'Passwords must match', type: 'validate' });
			setError('confirmNewPassword', { message: 'Passwords must match', type: 'validate' });
			AccessibilityInfo.announceForAccessibility('Passwords must match');
			return;
		}
		try {
			setValue('saving', true);
			const { username, emails } = user;
			if (fromProfileView) {
				const params = { currentPassword: sha256(currentPassword), newPassword, username, email: emails?.[0].address || '' };
				const twoFactorOptions = currentPassword
					? { twoFactorCode: params?.currentPassword, twoFactorMethod: TwoFactorMethods.PASSWORD }
					: null;
				const result = await saveUserProfileMethod(params, {}, twoFactorCode || twoFactorOptions);

				if (result) {
					logEvent(events.PROFILE_SAVE_CHANGES);
					dispatch(setUser({ ...params }));
					EventEmitter.emit(LISTENER, { message: I18n.t('Profile_saved_successfully') });
					navigation.goBack();
				}
			}
		} catch (e: any) {
			if (e?.error === 'totp-invalid' && e?.details.method !== TwoFactorMethods.PASSWORD) {
				try {
					const code = await twoFactor({ method: e.details.method, invalid: e?.error === 'totp-invalid' && !!twoFactorCode });
					setTwoFactorCode(code as any);
					return handleSetNewPassword();
				} catch {
					// cancelled twoFactor modal
				}
			}

			if (e?.error === 'totp-invalid' && e?.details.method === TwoFactorMethods.PASSWORD) {
				setError('currentPassword', { message: I18n.t('error-invalid-password'), type: 'validate' });
				AccessibilityInfo.announceForAccessibility(I18n.t('error-invalid-password'));
				return;
			}

			setValue('currentPassword', '');
			setTwoFactorCode(null);
			handleSaveUserProfileError(e, 'saving_profile');
		} finally {
			setValue('saving', false);
		}
	};

	const handleSetNewPassword = async () => {
		if (fromProfileView) {
			await changePasswordFromProfileView();
		} else {
			await changePassword();
		}
	};

	useA11yErrorAnnouncement({ errors, inputValues });

	useLayoutEffect(() => {
		const server = serverURL?.replace(/(^\w+:|^)\/\//, '');
		navigation.setOptions({
			headerTitle: server
		});
	}, [navigation, serverURL]);

	return (
		<KeyboardView backgroundColor={colors.surfaceTint}>
			<StatusBar />
			<SafeAreaView style={{ backgroundColor: colors.surfaceTint }} testID='change-password-view'>
				<ScrollView
					contentContainerStyle={[
						sharedStyles.containerScrollView,
						styles.containerScrollView,
						{ backgroundColor: colors.surfaceTint }
					]}
					testID='change-password-view-list'
					{...scrollPersistTaps}>
					<Text style={{ ...styles.createNewPasswordTitle, color: colors.fontTitlesLabels }}>Create new password</Text>

					<View style={{ gap: 12 }}>
						{fromProfileView ? (
							<ControlledFormTextInput
								name='currentPassword'
								control={control}
								editable={Accounts_AllowPasswordChange}
								inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
								label={I18n.t('Current_password')}
								textContentType={isAndroid ? 'password' : undefined}
								autoComplete={isAndroid ? 'password' : undefined}
								secureTextEntry
								required
								containerStyle={styles.inputContainer}
								testID='change-password-view-current-password'
								error={errors.currentPassword?.message}
							/>
						) : null}

						<ControlledFormTextInput
							name='newPassword'
							control={control}
							editable={Accounts_AllowPasswordChange}
							inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
							label={I18n.t('New_Password')}
							textContentType={isAndroid ? 'newPassword' : undefined}
							autoComplete={isAndroid ? 'password-new' : undefined}
							secureTextEntry
							required
							containerStyle={styles.inputContainer}
							testID='change-password-view-new-password'
							error={errors.newPassword?.message}
							showErrorMessage={false}
						/>

						{Accounts_RequirePasswordConfirmation ? (
							<ControlledFormTextInput
								name='confirmNewPassword'
								control={control}
								editable={Accounts_AllowPasswordChange}
								inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
								textContentType={isAndroid ? 'newPassword' : undefined}
								autoComplete={isAndroid ? 'password-new' : undefined}
								secureTextEntry
								required
								containerStyle={styles.inputContainer}
								testID='change-password-view-confirm-new-password'
								error={errors.confirmNewPassword?.message}
							/>
						) : null}
					</View>

					{passwordPolicies ? (
						<PasswordPolicies isDirty={isDirty} password={inputValues.newPassword} policies={passwordPolicies} />
					) : null}

					<View style={{ columnGap: 12 }}>
						<Button title={I18n.t('Cancel')} type='secondary' onPress={onCancel} testID='change-password-view-cancel-button' />
						<Button
							loading={inputValues.saving}
							disabled={!isPasswordValid}
							title={I18n.t('Set_new_password')}
							type='primary'
							onPress={handleSetNewPassword}
							testID='change-password-view-set-new-password-button'
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ChangePasswordView;
