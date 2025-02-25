import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
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
import Touch from '../../containers/Touch';
import { IApplicationState, IAvatarButton, IBaseScreen, IProfileParams, IUser } from '../../definitions';
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

class ProfileView extends React.Component<IProfileViewProps, IProfileViewState> {
	private name?: TextInput | null;
	private username?: TextInput | null;
	private email?: TextInput | null;
	private avatarUrl?: TextInput | null;
	private newPassword?: TextInput | null;
	private nickname?: TextInput | null;
	private bio?: TextInput | null;
	private focusListener = () => {};

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
		const options: NativeStackNavigationOptions = {
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

	constructor(props: IProfileViewProps) {
		super(props);
		this.setHeader();
	}

	state: IProfileViewState = {
		saving: false,
		name: '',
		username: '',
		email: '',
		bio: '',
		nickname: '',
		newPassword: '',
		currentPassword: '',
		customFields: {},
		twoFactorCode: null
	};

	componentDidMount() {
		this.focusListener = this.props.navigation.addListener('focus', () => {
			this.init();
		});
	}

	componentWillUnmount() {
		this.focusListener();
	}

	init = (user?: IUser) => {
		const { user: userProps } = this.props;
		const { name, username, emails, customFields, bio, nickname } = user || userProps;

		this.setState({
			name: name as string,
			username,
			email: emails ? emails[0].address : null,
			newPassword: null,
			currentPassword: null,
			customFields: customFields || {},
			bio,
			nickname
		});
	};

	formIsChanged = () => {
		const { name, username, email, newPassword, customFields, bio, nickname } = this.state;
		const { user } = this.props;
		let customFieldsChanged = false;

		const customFieldsKeys = Object.keys(customFields);
		if (customFieldsKeys.length) {
			customFieldsKeys.forEach(key => {
				if (!user.customFields || user.customFields[key] !== customFields[key]) {
					customFieldsChanged = true;
				}
			});
		}

		return !(
			(!name.trim() || user.name === name) &&
			(!username.trim() || user.username === username) &&
			(!newPassword?.trim() || !newPassword) &&
			(!email || !email.trim() || (user.emails && user.emails[0].address === email)) &&
			user.bio === bio &&
			user.nickname === nickname &&
			!customFieldsChanged
		);
	};

	submit = async (): Promise<void> => {
		Keyboard.dismiss();

		if (!this.formIsChanged()) {
			return;
		}

		this.setState({ saving: true });

		const { name, username, email, newPassword, currentPassword, customFields, twoFactorCode, bio, nickname } = this.state;
		const { user, dispatch } = this.props;
		const params = {} as IProfileParams;

		// Name
		if (user.name !== name) {
			params.realname = name;
		}

		// Username
		if (user.username !== username) {
			params.username = username;
		}

		// Email
		if (user.emails && user.emails[0].address !== email) {
			params.email = email;
		}

		if (user.bio !== bio) {
			params.bio = bio;
		}

		if (user.nickname !== nickname) {
			params.nickname = nickname;
		}

		// newPassword
		if (newPassword) {
			params.newPassword = newPassword;
		}

		// currentPassword
		if (currentPassword) {
			params.currentPassword = sha256(currentPassword);
		}

		const requirePassword = !!params.email || newPassword;

		if (requirePassword && !params.currentPassword) {
			this.setState({ saving: false });
			this.props.showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title={I18n.t('Please_enter_your_password')}
						description={I18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
						testID='profile-view-enter-password-sheet'
						placeholder={I18n.t('Password')}
						onSubmit={p => {
							this.props.hideActionSheet();
							this.setState({ currentPassword: p as string }, () => this.submit());
						}}
						onCancel={this.props.hideActionSheet}
					/>
				)
			});
			return;
		}

		try {
			const twoFactorOptions = params.currentPassword
				? {
						twoFactorCode: params.currentPassword,
						twoFactorMethod: TwoFactorMethods.PASSWORD
				  }
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
					this.setState({ ...this.state, customFields, ...params });
				} else {
					dispatch(setUser({ ...params }));
					this.setState({ ...this.state, ...params });
				}
				EventEmitter.emit(LISTENER, { message: I18n.t('Profile_saved_successfully') });
			}
			this.setState({ saving: false, currentPassword: null, twoFactorCode: null });
		} catch (e: any) {
			if (e?.error === 'totp-invalid' && e?.details.method !== TwoFactorMethods.PASSWORD) {
				try {
					const code = await twoFactor({ method: e?.details.method, invalid: e?.error === 'totp-invalid' && !!twoFactorCode });
					return this.setState({ twoFactorCode: code }, () => this.submit());
				} catch {
					// cancelled twoFactor modal
				}
			}
			logEvent(events.PROFILE_SAVE_CHANGES_F);
			this.setState({ saving: false, currentPassword: null, twoFactorCode: null });
			this.handleError(e, 'saving_profile');
		}
	};

	resetAvatar = async () => {
		const { Accounts_AllowUserAvatarChange } = this.props;

		if (!Accounts_AllowUserAvatarChange) {
			return;
		}

		try {
			const { user } = this.props;
			await Services.resetAvatar(user.id);
			EventEmitter.emit(LISTENER, { message: I18n.t('Avatar_changed_successfully') });
			this.init();
		} catch (e) {
			this.handleError(e, 'changing_avatar');
		}
	};

	handleError = (e: any, action: string) => {
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

	handleEditAvatar = () => {
		const { navigation } = this.props;
		navigation.navigate('ChangeAvatarView', { context: 'profile' });
	};

	renderAvatarButton = ({ key, child, onPress, disabled = false }: IAvatarButton) => {
		const { theme } = this.props;
		return (
			<Touch
				key={key}
				testID={key}
				onPress={onPress}
				style={[styles.avatarButton, { opacity: disabled ? 0.5 : 1 }, { backgroundColor: themes[theme].strokeLight }]}
				enabled={!disabled}>
				{child}
			</Touch>
		);
	};

	renderCustomFields = () => {
		const { customFields } = this.state;
		const { Accounts_CustomFields } = this.props;

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
								this.setState({ customFields: { ...customFields, ...newValue } });
							}}
							value={customFields[key]}>
							<FormTextInput
								inputRef={e => {
									// @ts-ignore
									this[key] = e;
								}}
								label={key}
								placeholder={key}
								value={customFields[key]}
								testID='settings-view-language'
							/>
						</RNPickerSelect>
					);
				}

				return (
					<FormTextInput
						inputRef={e => {
							// @ts-ignore
							this[key] = e;
						}}
						key={key}
						label={key}
						placeholder={key}
						value={customFields[key]}
						onChangeText={value => {
							const newValue: { [key: string]: string } = {};
							newValue[key] = value;
							this.setState({ customFields: { ...customFields, ...newValue } });
						}}
						onSubmitEditing={() => {
							if (array.length - 1 > index) {
								// @ts-ignore
								return this[array[index + 1]].focus();
							}
							this.avatarUrl?.focus();
						}}
					/>
				);
			});
		} catch (error) {
			return null;
		}
	};

	logoutOtherLocations = () => {
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

	deleteOwnAccount = () => {
		logEvent(events.DELETE_OWN_ACCOUNT);
		this.props.showActionSheet({
			children: <DeleteAccountActionSheetContent />
		});
	};

	render() {
		const { name, username, email, newPassword, customFields, saving, nickname, bio } = this.state;
		const {
			user,
			theme,
			Accounts_AllowEmailChange,
			Accounts_AllowPasswordChange,
			Accounts_AllowRealNameChange,
			Accounts_AllowUserAvatarChange,
			Accounts_AllowUsernameChange,
			Accounts_CustomFields,
			Accounts_AllowDeleteOwnAccount,
			serverVersion
		} = this.props;

		return (
			<KeyboardView contentContainerStyle={sharedStyles.container} keyboardVerticalOffset={128}>
				<StatusBar />
				<SafeAreaView testID='profile-view'>
					<ScrollView
						contentContainerStyle={[sharedStyles.containerScrollView, { backgroundColor: themes[theme].surfaceTint }]}
						testID='profile-view-list'
						{...scrollPersistTaps}>
						<View style={styles.avatarContainer} testID='profile-view-avatar'>
							<AvatarWithEdit
								text={user.username}
								handleEdit={Accounts_AllowUserAvatarChange ? this.handleEditAvatar : undefined}
							/>
						</View>
						<FormTextInput
							editable={Accounts_AllowRealNameChange}
							inputStyle={[!Accounts_AllowRealNameChange && styles.disabled]}
							inputRef={e => (this.name = e)}
							label={I18n.t('Name')}
							placeholder={I18n.t('Name')}
							value={name}
							onChangeText={(value: string) => this.setState({ name: value })}
							onSubmitEditing={() => {
								this.username?.focus();
							}}
							testID='profile-view-name'
						/>
						<FormTextInput
							editable={Accounts_AllowUsernameChange}
							inputStyle={[!Accounts_AllowUsernameChange && styles.disabled]}
							inputRef={e => (this.username = e)}
							label={I18n.t('Username')}
							placeholder={I18n.t('Username')}
							value={username}
							onChangeText={value => this.setState({ username: value })}
							onSubmitEditing={() => {
								this.email?.focus();
							}}
							testID='profile-view-username'
						/>
						<FormTextInput
							editable={Accounts_AllowEmailChange}
							inputStyle={[!Accounts_AllowEmailChange && styles.disabled]}
							inputRef={e => (this.email = e)}
							label={I18n.t('Email')}
							placeholder={I18n.t('Email')}
							value={email || undefined}
							onChangeText={value => this.setState({ email: value })}
							onSubmitEditing={() => {
								this.nickname?.focus();
							}}
							testID='profile-view-email'
						/>
						{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.5.0') ? (
							<FormTextInput
								inputRef={e => (this.nickname = e)}
								label={I18n.t('Nickname')}
								value={nickname}
								onChangeText={value => this.setState({ nickname: value })}
								onSubmitEditing={() => {
									this.bio?.focus();
								}}
								testID='profile-view-nickname'
								maxLength={MAX_NICKNAME_LENGTH}
							/>
						) : null}
						{compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.1.0') ? (
							<FormTextInput
								inputRef={e => (this.bio = e)}
								label={I18n.t('Bio')}
								inputStyle={styles.inputBio}
								multiline
								maxLength={MAX_BIO_LENGTH}
								value={bio}
								onChangeText={value => this.setState({ bio: value })}
								onSubmitEditing={() => {
									this.newPassword?.focus();
								}}
								testID='profile-view-bio'
							/>
						) : null}
						<FormTextInput
							editable={Accounts_AllowPasswordChange}
							inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
							inputRef={e => (this.newPassword = e)}
							label={I18n.t('New_Password')}
							placeholder={I18n.t('New_Password')}
							value={newPassword || undefined}
							onChangeText={value => this.setState({ newPassword: value })}
							onSubmitEditing={() => {
								if (Accounts_CustomFields && Object.keys(customFields).length) {
									// @ts-ignore
									return this[Object.keys(customFields)[0]].focus();
								}
								this.avatarUrl?.focus();
							}}
							secureTextEntry
							testID='profile-view-new-password'
						/>
						{this.renderCustomFields()}
						<Button
							title={I18n.t('Save_Changes')}
							type='primary'
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='profile-view-submit'
							loading={saving}
						/>
						<Button
							title={I18n.t('Logout_from_other_logged_in_locations')}
							type='secondary'
							onPress={this.logoutOtherLocations}
							testID='profile-view-logout-other-locations'
						/>
						{Accounts_AllowDeleteOwnAccount ? (
							<Button
								title={I18n.t('Delete_my_account')}
								type='primary'
								backgroundColor={themes[theme].buttonBackgroundDangerDefault}
								onPress={this.deleteOwnAccount}
								testID='profile-view-delete-my-account'
							/>
						) : null}
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
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
