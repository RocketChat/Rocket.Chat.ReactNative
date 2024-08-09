import { StackNavigationOptions } from '@react-navigation/stack';
import { sha256 } from 'js-sha256';
import React from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { connect } from 'react-redux';

import { setUser } from '../../actions/login';
import { IActionSheetProvider, withActionSheet } from '../../containers/ActionSheet';
import ActionSheetContentWithInputAndSubmit from '../../containers/ActionSheet/ActionSheetContentWithInputAndSubmit';
import { AvatarWithEdit } from '../../containers/Avatar';
import Button from '../../containers/Button';
import * as HeaderButton from '../../containers/HeaderButton';
import KeyboardView from '../../containers/KeyboardView';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { FormTextInput } from '../../containers/TextInput';
import { LISTENER } from '../../containers/Toast';
import { IApplicationState, IBaseScreen, IProfileParams, IUser } from '../../definitions';
import { TwoFactorMethods } from '../../definitions/ITotp';
import I18n from '../../i18n';
import { themes } from '../../lib/constants';
import { compareServerVersion, showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { events, logEvent } from '../../lib/methods/helpers/log';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { Services } from '../../lib/services';
import { twoFactor } from '../../lib/services/twoFactor';
import { getUserSelector } from '../../selectors/login';
import { ProfileStackParamList } from '../../stacks/types';
import { TSupportedThemes, withTheme } from '../../theme';
import sharedStyles from '../Styles';
import { DeleteAccountActionSheetContent } from './components/DeleteAccountActionSheetContent';
import styles from './styles';

// https://github.com/RocketChat/Rocket.Chat/blob/174c28d40b3d5a52023ee2dca2e81dd77ff33fa5/apps/meteor/app/lib/server/functions/saveUser.js#L24-L25
const MAX_BIO_LENGTH = 260;
const MAX_NICKNAME_LENGTH = 120;

interface IProfileViewProps extends IActionSheetProvider, IBaseScreen<ProfileStackParamList, 'ProfileView'> {
	user: IUser;
	baseUrl: string;
	Accounts_AllowEmailChange: boolean;
	Accounts_AllowPasswordChange: boolean;
	Accounts_AllowRealNameChange: boolean;
	Accounts_AllowUserAvatarChange: boolean;
	Accounts_AllowUsernameChange: boolean;
	Accounts_CustomFields: string;
	theme: TSupportedThemes;
	Accounts_AllowDeleteOwnAccount: boolean;
	isMasterDetail: boolean;
	serverVersion: string;
}

interface IProfileViewState {
	saving: boolean;
	name: string;
	username: string;
	email: string | null;
	bio?: string;
	nickname?: string;
	newPassword: string | null;
	currentPassword: string | null;
	customFields: {
		[key: string | number]: string;
	};
	twoFactorCode: null | {
		twoFactorCode: string;
		twoFactorMethod: string;
	};
}

function ProfileView({
	user,
	Accounts_AllowEmailChange,
	Accounts_AllowPasswordChange,
	Accounts_AllowRealNameChange,
	Accounts_AllowUserAvatarChange,
	Accounts_AllowUsernameChange,
	Accounts_CustomFields,
	theme,
	Accounts_AllowDeleteOwnAccount,
	isMasterDetail,
	serverVersion,
	navigation,
	showActionSheet,
	hideActionSheet,
	dispatch
}: IProfileViewProps) {
	const [state, setState] = React.useState<IProfileViewState>({
		saving: false,
		name: user?.name ?? '',
		username: user?.username ?? '',
		email: user?.emails?.[0]?.address ?? null,
		bio: user?.bio ?? '',
		nickname: user?.nickname ?? '',
		newPassword: null,
		currentPassword: null,
		customFields: user?.customFields ?? {},
		twoFactorCode: null
	});

	const nameRef = React.useRef<TextInput>(null);
	const usernameRef = React.useRef<TextInput>(null);
	const emailRef = React.useRef<TextInput>(null);
	const avatarUrlRef = React.useRef<TextInput>(null);
	const newPasswordRef = React.useRef<TextInput>(null);
	const nicknameRef = React.useRef<TextInput>(null);
	const bioRef = React.useRef<TextInput>(null);

	React.useEffect(() => {
		const focusListener = navigation.addListener('focus', () => {
			setHeader();
		});

		return () => {
			focusListener();
		};
	});

	const setHeader = () => {
		const options: StackNavigationOptions = {
			title: I18n.t('Profile')
		};
		if (!isMasterDetail) {
			options.headerLeft = () => <HeaderButton.Drawer navigation={navigation} />;
		}
		options.headerRight = () => (
			<HeaderButton.Preferences onPress={() => navigation?.navigate('UserPreferencesView')} testID='preferences-view-open' />
		);

		navigation.setOptions(options);
	};

	const formIsChanged = React.useCallback(() => {
		let customFieldsChanged = false;

		const customFieldsKeys = Object.keys(state.customFields);
		if (customFieldsKeys.length) {
			customFieldsKeys.forEach(key => {
				if (!user.customFields || user.customFields[key] !== state.customFields[key]) {
					customFieldsChanged = true;
				}
			});
		}

		return !(
			user.name === state.name &&
			user.username === state.username &&
			user.bio === state.bio &&
			user.nickname === state.nickname &&
			!state.newPassword &&
			user.emails &&
			user.emails[0].address === state.email &&
			!customFieldsChanged
		);
	}, [state, user]);

	const submit = React.useCallback(async () => {
		Keyboard.dismiss();

		if (!formIsChanged()) {
			return;
		}

		setState(prevState => ({
			...prevState,
			saving: true
		}));

		const params = {} as IProfileParams;

		if (user.name !== state.name) {
			params.realname = state.name;
		}

		if (user.username !== state.username) {
			params.username = state.username;
		}

		if (user.emails && user.emails[0].address !== state.email) {
			params.email = state.email;
		}

		if (user.bio !== state.bio) {
			params.bio = state.bio;
		}

		if (user.nickname !== state.nickname) {
			params.nickname = state.nickname;
		}

		if (state.newPassword) {
			params.newPassword = state.newPassword;
		}

		if (state.currentPassword) {
			params.currentPassword = sha256(state.currentPassword);
		}

		const requirePassword = !!params.email || state.newPassword;

		if (requirePassword && !params.currentPassword) {
			setState(prevState => ({
				...prevState,
				saving: false
			}));
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title={I18n.t('Please_enter_your_password')}
						description={I18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
						testID='profile-view-enter-password-sheet'
						placeholder={I18n.t('Password')}
						onSubmit={(p: string | string[]) => {
							hideActionSheet();
							setState(prevState => ({
								...prevState,
								currentPassword: p as string
							}));
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
				? {
						// eslint-disable-next-line @typescript-eslint/indent
						twoFactorCode: params.currentPassword,
						// eslint-disable-next-line @typescript-eslint/indent
						twoFactorMethod: TwoFactorMethods.PASSWORD
				  }
				: null;

			const result = await Services.saveUserProfileMethod(params, state.customFields, state.twoFactorCode || twoFactorOptions);

			if (result) {
				logEvent(events.PROFILE_SAVE_CHANGES);
				if ('realname' in params) {
					params.name = params.realname;
					delete params.realname;
				}
				if (state.customFields) {
					dispatch(setUser({ ...state.customFields, ...params }));
					setState(prevState => ({
						...prevState,
						...params,
						...state.customFields
					}));
				} else {
					dispatch(setUser({ ...params }));
					setState(prevState => ({
						...prevState,
						...params
					}));
				}
				EventEmitter.emit(LISTENER, { message: I18n.t('Profile_saved_successfully') });
			}
			setState(prevState => ({
				...prevState,
				saving: false,
				currentPassword: null,
				twoFactorCode: null
			}));
		} catch (e: any) {
			if (e?.error === 'totp-invalid' && e?.details.method !== TwoFactorMethods.PASSWORD) {
				try {
					const code = await twoFactor({
						method: e?.details.method,
						invalid: e?.error === 'totp-invalid' && !!state.twoFactorCode
					});
					setState(prevState => ({
						...prevState,
						twoFactorCode: code
					}));
					submit();
					return;
				} catch {
					// cancelled twoFactor modal
				}
			}
			logEvent(events.PROFILE_SAVE_CHANGES_F);
			setState(prevState => ({
				...prevState,
				saving: false,
				currentPassword: null,
				twoFactorCode: null
			}));
			handleError(e, 'saving_profile');
		}
	}, [formIsChanged, user, state, dispatch, showActionSheet, hideActionSheet]);

	const handleError = (e: any, action: string) => {
		if (e.data && e.data.error.includes('[error-too-many-requests]')) {
			return showErrorAlert(e.data.error);
		}
		if (I18n.isTranslated(e.error)) {
			return showErrorAlert(I18n.t(e.error));
		}
		let msg = I18n.t('There_was_an_error_while_action', { action: I18n.t(action) });
		let title = '';
		if (typeof e.reason === 'string') {
			title = msg;
			msg = e.reason;
		}
		showErrorAlert(msg, title);
	};

	const handleEditAvatar = () => {
		navigation.navigate('ChangeAvatarView', { context: 'profile' });
	};

	const renderCustomFields = React.useMemo(() => {
		if (!Accounts_CustomFields) {
			return null;
		}
		try {
			const parsedCustomFields = JSON.parse(Accounts_CustomFields);
			return Object.keys(parsedCustomFields).map((key, index, array) => {
				if (parsedCustomFields[key].type === 'select') {
					const options = parsedCustomFields[key].options.map((option: string) => ({ label: option, value: option }));
					return (
						<RNPickerSelect
							key={key}
							items={options}
							onValueChange={value => {
								const newValue: { [key: string]: string } = {};
								newValue[key] = value;
								setState(prevState => ({
									...prevState,
									customFields: { ...state.customFields, ...newValue }
								}));
							}}
							value={state.customFields[key]}>
							<FormTextInput
								inputRef={e => {
									// @ts-ignore
									this[key] = e;
								}}
								label={key}
								placeholder={key}
								value={state.customFields[key]}
								testID='settings-view-language'
							/>
						</RNPickerSelect>
					);
				}

				return (
					<FormTextInput
						inputRef={key === 'nickname' ? nicknameRef : undefined}
						key={key}
						label={key}
						placeholder={key}
						value={state.customFields[key]}
						onChangeText={value => {
							const newValue: { [key: string]: string } = {};
							newValue[key] = value;
							setState(prevState => ({
								...prevState,
								customFields: { ...state.customFields, ...newValue }
							}));
						}}
						onSubmitEditing={() => {
							if (array.length - 1 > index) {
								// @ts-ignore
								return this[array[index + 1]].focus();
							}
							avatarUrlRef.current?.focus();
						}}
					/>
				);
			});
		} catch (error) {
			return null;
		}
	}, [Accounts_CustomFields, state.customFields]);

	const logoutOtherLocations = () => {
		logEvent(events.PL_OTHER_LOCATIONS);
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_from_other_locations'),
			confirmationText: I18n.t('Logout'),
			onPress: async () => {
				try {
					await Services.logoutOtherLocations();
					EventEmitter.emit(LISTENER, { message: I18n.t('Logged_out_of_other_clients_successfully') });
				} catch {
					logEvent(events.PL_OTHER_LOCATIONS_F);
					EventEmitter.emit(LISTENER, { message: I18n.t('Logout_failed') });
				}
			}
		});
	};

	const deleteOwnAccount = () => {
		logEvent(events.DELETE_OWN_ACCOUNT);
		showActionSheet({
			children: <DeleteAccountActionSheetContent />
		});
	};

	return (
		<KeyboardView contentContainerStyle={sharedStyles.container} keyboardVerticalOffset={128}>
			<StatusBar />
			<SafeAreaView testID='profile-view'>
				<ScrollView
					contentContainerStyle={[sharedStyles.containerScrollView, { backgroundColor: themes[theme].surfaceTint }]}
					testID='profile-view-list'
					{...scrollPersistTaps}>
					<View style={styles.avatarContainer} testID='profile-view-avatar'>
						<AvatarWithEdit text={user.username} handleEdit={Accounts_AllowUserAvatarChange ? handleEditAvatar : undefined} />
					</View>
					<FormTextInput
						editable={Accounts_AllowRealNameChange}
						inputStyle={[!Accounts_AllowRealNameChange && styles.disabled]}
						inputRef={nameRef}
						label={I18n.t('Name')}
						placeholder={I18n.t('Name')}
						value={state.name}
						onChangeText={(value: string) =>
							setState(prevState => ({
								...prevState,
								name: value
							}))
						}
						onSubmitEditing={() => {
							usernameRef.current?.focus();
						}}
						testID='profile-view-name'
					/>
					<FormTextInput
						editable={Accounts_AllowUsernameChange}
						inputStyle={[!Accounts_AllowUsernameChange && styles.disabled]}
						inputRef={usernameRef}
						label={I18n.t('Username')}
						placeholder={I18n.t('Username')}
						value={state.username}
						onChangeText={(value: string) =>
							setState(prevState => ({
								...prevState,
								username: value
							}))
						}
						onSubmitEditing={() => {
							emailRef.current?.focus();
						}}
						testID='profile-view-username'
					/>
					<FormTextInput
						editable={Accounts_AllowEmailChange}
						inputStyle={[!Accounts_AllowEmailChange && styles.disabled]}
						inputRef={emailRef}
						label={I18n.t('Email')}
						placeholder={I18n.t('Email')}
						value={state.email || undefined}
						onChangeText={(value: string) =>
							setState(prevState => ({
								...prevState,
								email: value
							}))
						}
						onSubmitEditing={() => {
							nicknameRef.current?.focus();
						}}
						testID='profile-view-email'
					/>
					{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.5.0') ? (
						<FormTextInput
							inputRef={nicknameRef}
							label={I18n.t('Nickname')}
							value={state.nickname}
							onChangeText={(value: string) =>
								setState(prevState => ({
									...prevState,
									nickname: value
								}))
							}
							onSubmitEditing={() => {
								bioRef.current?.focus();
							}}
							testID='profile-view-nickname'
							maxLength={MAX_NICKNAME_LENGTH}
						/>
					) : null}
					{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.1.0') ? (
						<FormTextInput
							inputRef={bioRef}
							label={I18n.t('Bio')}
							inputStyle={styles.inputBio}
							multiline
							maxLength={MAX_BIO_LENGTH}
							value={state.bio}
							onChangeText={(value: string) =>
								setState(prevState => ({
									...prevState,
									bio: value
								}))
							}
							onSubmitEditing={() => {
								newPasswordRef.current?.focus();
							}}
							testID='profile-view-bio'
						/>
					) : null}
					<FormTextInput
						editable={Accounts_AllowPasswordChange}
						inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
						inputRef={newPasswordRef}
						label={I18n.t('New_Password')}
						placeholder={I18n.t('New_Password')}
						value={state.newPassword || undefined}
						onChangeText={(value: string) =>
							setState(prevState => ({
								...prevState,
								newPassword: value
							}))
						}
						onSubmitEditing={() => {
							if (Accounts_CustomFields && Object.keys(state.customFields).length) {
								// @ts-ignore
								return this[Object.keys(state.customFields)[0]].focus();
							}
							avatarUrlRef.current?.focus();
						}}
						secureTextEntry
						testID='profile-view-new-password'
					/>
					{renderCustomFields}
					<Button
						title={I18n.t('Save_Changes')}
						type='primary'
						onPress={submit}
						disabled={!formIsChanged()}
						testID='profile-view-submit'
						loading={state.saving}
					/>
					<Button
						title={I18n.t('Logout_from_other_logged_in_locations')}
						type='secondary'
						onPress={logoutOtherLocations}
						testID='profile-view-logout-other-locations'
					/>
					{Accounts_AllowDeleteOwnAccount ? (
						<Button
							title={I18n.t('Delete_my_account')}
							type='primary'
							backgroundColor={themes[theme].buttonBackgroundDangerDefault}
							onPress={deleteOwnAccount}
							testID='profile-view-delete-my-account'
						/>
					) : null}
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
}

const mapStateToProps = (state: IApplicationState) => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	Accounts_AllowEmailChange: state.settings.Accounts_AllowEmailChange as boolean,
	Accounts_AllowPasswordChange: state.settings.Accounts_AllowPasswordChange as boolean,
	Accounts_AllowRealNameChange: state.settings.Accounts_AllowRealNameChange as boolean,
	Accounts_AllowUserAvatarChange: state.settings.Accounts_AllowUserAvatarChange as boolean,
	Accounts_AllowUsernameChange: state.settings.Accounts_AllowUsernameChange as boolean,
	Accounts_CustomFields: state.settings.Accounts_CustomFields as string,
	baseUrl: state.server.server,
	serverVersion: state.server.version,
	Accounts_AllowDeleteOwnAccount: state.settings.Accounts_AllowDeleteOwnAccount as boolean
});

export default connect(mapStateToProps)(withTheme(withActionSheet(ProfileView)));
