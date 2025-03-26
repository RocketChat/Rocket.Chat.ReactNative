import { NativeStackNavigationOptions, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { sha256 } from 'js-sha256';
import React, { useLayoutEffect, useState } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { setUser } from '../../actions/login';
import { useActionSheet } from '../../containers/ActionSheet';
import ActionSheetContentWithInputAndSubmit from '../../containers/ActionSheet/ActionSheetContentWithInputAndSubmit';
import { AvatarWithEdit } from '../../containers/Avatar';
import Button from '../../containers/Button';
import * as HeaderButton from '../../containers/HeaderButton';
import KeyboardView from '../../containers/KeyboardView';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { LISTENER } from '../../containers/Toast';
import { IProfileParams } from '../../definitions';
import { TwoFactorMethods } from '../../definitions/ITotp';
import I18n from '../../i18n';
import { compareServerVersion } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { events, logEvent } from '../../lib/methods/helpers/log';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { Services } from '../../lib/services';
import { twoFactor } from '../../lib/services/twoFactor';
import { getUserSelector } from '../../selectors/login';
import { ProfileStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { DeleteAccountActionSheetContent } from './components/DeleteAccountActionSheetContent';
import styles from './styles';
import { useAppSelector } from '../../lib/hooks';
import useParsedCustomFields from '../../lib/hooks/useParsedCustomFields';
import getCustomFields from '../../lib/methods/getCustomFields';
import CustomFields from './components/CustomFields';
import ListSeparator from '../../containers/List/ListSeparator';
import PasswordPolicies from '../../containers/PasswordPolicies';
import handleError from './methods/handleError';
import logoutOtherLocations from './methods/logoutOtherLocations';
import useVerifyPassword from '../../lib/hooks/useVerifyPassword';

// https://github.com/RocketChat/Rocket.Chat/blob/174c28d40b3d5a52023ee2dca2e81dd77ff33fa5/apps/meteor/app/lib/server/functions/saveUser.js#L24-L25
const MAX_BIO_LENGTH = 260;
const MAX_NICKNAME_LENGTH = 120;
const validationSchema = yup.object().shape({
	name: yup.string().min(1).required(),
	email: yup.string().email().required(),
	username: yup.string().min(1).required()
});

interface IProfileViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'ProfileView'>;
}
const ProfileView = ({ navigation }: IProfileViewProps): React.ReactElement => {
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const {
		Accounts_AllowDeleteOwnAccount,
		Accounts_AllowEmailChange,
		Accounts_AllowPasswordChange,
		Accounts_AllowRealNameChange,
		Accounts_AllowUserAvatarChange,
		Accounts_AllowUsernameChange,
		Accounts_CustomFields,
		isMasterDetail,
		serverVersion,
		user
	} = useAppSelector(state => ({
		user: getUserSelector(state),
		isMasterDetail: state.app.isMasterDetail,
		Accounts_AllowEmailChange: state.settings.Accounts_AllowEmailChange as boolean,
		Accounts_AllowPasswordChange: state.settings.Accounts_AllowPasswordChange as boolean,
		Accounts_AllowRealNameChange: state.settings.Accounts_AllowRealNameChange as boolean,
		Accounts_AllowUserAvatarChange: state.settings.Accounts_AllowUserAvatarChange as boolean,
		Accounts_AllowUsernameChange: state.settings.Accounts_AllowUsernameChange as boolean,
		Accounts_CustomFields: state.settings.Accounts_CustomFields as string,
		serverVersion: state.server.version,
		Accounts_AllowDeleteOwnAccount: state.settings.Accounts_AllowDeleteOwnAccount as boolean
	}));
	const {
		control,
		handleSubmit,
		setFocus,
		getValues,
		setValue,
		watch,
		formState: { isDirty, dirtyFields }
	} = useForm({
		mode: 'onChange',
		defaultValues: {
			name: user?.name as string,
			username: user?.username,
			email: user?.emails ? user?.emails[0].address : null,
			newPassword: null,
			currentPassword: null,
			bio: user?.bio,
			nickname: user?.nickname,
			saving: false
		},
		resolver: yupResolver(validationSchema)
	});
	const newPassword = watch('newPassword') ?? '';
	const { isPasswordValid, passwordPolicies } = useVerifyPassword(newPassword, newPassword);
	const { parsedCustomFields } = useParsedCustomFields(Accounts_CustomFields);
	const [customFields, setCustomFields] = useState(getCustomFields(parsedCustomFields));
	const [twoFactorCode, setTwoFactorCode] = useState<{ twoFactorCode: string; twoFactorMethod: TwoFactorMethods } | null>(null);

	const validateFormInfo = () => {
		const isValid = validationSchema.isValidSync(getValues());
		if (!parsedCustomFields) {
			return isValid;
		}
		let requiredCheck = true;
		Object.keys(parsedCustomFields).forEach((key: string) => {
			if (parsedCustomFields[key].required) {
				requiredCheck = requiredCheck && customFields[key] && Boolean(customFields[key].trim());
			}
		});
		return isValid && requiredCheck;
	};

	const enableSaveChangesButton = () => {
		const isFormInfoValid = validateFormInfo();
		const { newPassword: isNewPasswordDirty } = dirtyFields;
		const passwordValid = isNewPasswordDirty && newPassword.length > 0 ? isPasswordValid() : true;
		return isFormInfoValid && isDirty && passwordValid;
	};

	const handleEditAvatar = () => {
		navigation.navigate('ChangeAvatarView', { context: 'profile' });
	};

	const deleteOwnAccount = () => {
		logEvent(events.DELETE_OWN_ACCOUNT);
		showActionSheet({ children: <DeleteAccountActionSheetContent /> });
	};

	const submit = async (): Promise<void> => {
		Keyboard.dismiss();

		if (!validateFormInfo()) {
			return;
		}

		setValue('saving', true);

		const { name, username, email, newPassword, currentPassword, bio, nickname } = getValues();
		const params = {} as IProfileParams;

		if (user.name !== name) params.realname = name;
		if (user.username !== username) params.username = username;
		if (user.emails?.[0].address !== email) params.email = email;
		if (user.bio !== bio) params.bio = bio;
		if (user.nickname !== nickname) params.nickname = nickname;
		if (newPassword) params.newPassword = newPassword;
		if (currentPassword) params.currentPassword = sha256(currentPassword);

		const requirePassword = !!params.email || newPassword;

		if (requirePassword && !params.currentPassword) {
			setValue('saving', false);
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title={I18n.t('Please_enter_your_password')}
						description={I18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
						testID='profile-view-enter-password-sheet'
						placeholder={I18n.t('Password')}
						onSubmit={p => {
							hideActionSheet();
							setValue('currentPassword', p as any);
							submit();
						}}
						onCancel={hideActionSheet}
					/>
				)
			});
			return;
		}

		try {
			const twoFactorOptions = params.currentPassword
				? { twoFactorCode: params.currentPassword, twoFactorMethod: TwoFactorMethods.PASSWORD }
				: null;

			const result = await Services.saveUserProfileMethod(params, customFields, twoFactorCode || twoFactorOptions);

			if (result) {
				logEvent(events.PROFILE_SAVE_CHANGES);
				if ('realname' in params) {
					params.name = params.realname;
					delete params.realname;
				}
				if (customFields) {
					dispatch(setUser({ customFields, ...params }));
					setCustomFields(customFields);
				} else {
					dispatch(setUser({ ...params }));
					const user = { ...getValues(), ...params };
					Object.entries(user).forEach(([key, value]) => setValue(key as any, value));
				}
				dispatch(setUser({ ...user, ...params, customFields }));
				EventEmitter.emit(LISTENER, { message: I18n.t('Profile_saved_successfully') });
			}

			setValue('saving', false);
			setValue('currentPassword', null);
			setTwoFactorCode(null);
		} catch (e: any) {
			if (e?.error === 'totp-invalid' && e?.details.method !== TwoFactorMethods.PASSWORD) {
				try {
					const code = await twoFactor({ method: e.details.method, invalid: e?.error === 'totp-invalid' && !!twoFactorCode });
					setTwoFactorCode(code as any);
					return submit();
				} catch {
					// Two-factor modal canceled
				}
			}
			logEvent(events.PROFILE_SAVE_CHANGES_F);
			setValue('saving', false);
			setValue('currentPassword', null);
			setTwoFactorCode(null);
			handleError(e, 'saving_profile');
		}
	};

	useLayoutEffect(() => {
		const options: NativeStackNavigationOptions = {
			title: I18n.t('Profile')
		};
		if (!isMasterDetail) {
			options.headerLeft = () => <HeaderButton.Drawer accessibilityLabel={I18n.t('Open_sidebar')} navigation={navigation} />;
		}
		options.headerRight = () => (
			<HeaderButton.Preferences
				accessibilityLabel={I18n.t('Preferences')}
				onPress={() => navigation?.navigate('UserPreferencesView')}
				testID='preferences-view-open'
			/>
		);

		navigation.setOptions(options);
	}, []);

	return (
		<KeyboardView contentContainerStyle={sharedStyles.container} keyboardVerticalOffset={128}>
			<StatusBar />
			<SafeAreaView testID='profile-view'>
				<ScrollView
					contentContainerStyle={[sharedStyles.containerScrollView, { backgroundColor: colors.surfaceTint, paddingTop: 32 }]}
					testID='profile-view-list'
					{...scrollPersistTaps}>
					<View style={styles.avatarContainer} testID='profile-view-avatar'>
						<AvatarWithEdit
							editAccessibilityLabel={I18n.t('Edit_Avatar')}
							text={user.username}
							handleEdit={Accounts_AllowUserAvatarChange ? handleEditAvatar : undefined}
						/>
					</View>
					<View style={styles.inputs}>
						<ControlledFormTextInput
							required
							name='name'
							control={control}
							editable={Accounts_AllowRealNameChange}
							inputStyle={[!Accounts_AllowRealNameChange && styles.disabled]}
							label={I18n.t('Name')}
							placeholder={I18n.t('Name')}
							onSubmitEditing={() => {
								setFocus('username');
							}}
							containerStyle={styles.inputContainer}
							testID='profile-view-name'
						/>
						<ControlledFormTextInput
							required
							name='username'
							control={control}
							editable={Accounts_AllowUsernameChange}
							inputStyle={[!Accounts_AllowUsernameChange && styles.disabled]}
							label={I18n.t('Username')}
							placeholder={I18n.t('Username')}
							onSubmitEditing={() => {
								setFocus('email');
							}}
							containerStyle={styles.inputContainer}
							testID='profile-view-username'
						/>
						<ControlledFormTextInput
							required
							name='email'
							control={control}
							editable={Accounts_AllowEmailChange}
							inputStyle={[!Accounts_AllowEmailChange && styles.disabled]}
							label={I18n.t('Email')}
							placeholder={I18n.t('Email')}
							onSubmitEditing={() => {
								setFocus('nickname');
							}}
							containerStyle={styles.inputContainer}
							testID='profile-view-email'
						/>
						{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.5.0') ? (
							<ControlledFormTextInput
								name='nickname'
								control={control}
								label={I18n.t('Nickname')}
								onSubmitEditing={() => {
									setFocus('bio');
								}}
								testID='profile-view-nickname'
								maxLength={MAX_NICKNAME_LENGTH}
								containerStyle={styles.inputContainer}
							/>
						) : null}
						{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.1.0') ? (
							<ControlledFormTextInput
								name='bio'
								control={control}
								label={I18n.t('Bio')}
								inputStyle={styles.inputBio}
								multiline
								maxLength={MAX_BIO_LENGTH}
								onSubmitEditing={() => {
									setFocus('newPassword');
								}}
								testID='profile-view-bio'
								containerStyle={styles.inputContainer}
							/>
						) : null}
						<ControlledFormTextInput
							name='newPassword'
							control={control}
							editable={Accounts_AllowPasswordChange}
							inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
							label={I18n.t('New_Password')}
							onSubmitEditing={() => {
								if (Accounts_CustomFields && Object.keys(customFields).length) {
									// @ts-ignore
									return this[Object.keys(customFields)[0]].focus();
								}
							}}
							secureTextEntry
							containerStyle={styles.inputContainer}
							testID='profile-view-new-password'
						/>
						<CustomFields
							Accounts_CustomFields={Accounts_CustomFields}
							customFields={customFields}
							onCustomFieldChange={value => setCustomFields(value)}
						/>
						{passwordPolicies && newPassword?.length > 0 ? (
							<PasswordPolicies isDirty={isDirty} password={newPassword} policies={passwordPolicies} />
						) : null}
					</View>

					<Button
						title={I18n.t('Save_Changes')}
						type='primary'
						onPress={handleSubmit(submit)}
						disabled={!enableSaveChangesButton()}
						testID='profile-view-submit'
						loading={getValues().saving}
						style={{ marginBottom: 0 }}
					/>

					<ListSeparator style={{ marginVertical: 12 }} />
					<Button
						title={I18n.t('Logout_from_other_logged_in_locations')}
						type='secondary'
						onPress={logoutOtherLocations}
						testID='profile-view-logout-other-locations'
					/>
					{Accounts_AllowDeleteOwnAccount ? (
						<Button
							title={I18n.t('Delete_my_account')}
							type='secondary'
							styleText={{ color: colors.fontDanger }}
							onPress={deleteOwnAccount}
							testID='profile-view-delete-my-account'
						/>
					) : null}
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ProfileView;
