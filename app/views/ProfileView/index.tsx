import React from 'react';
import { Keyboard, ScrollView, TextInput, View } from 'react-native';
import { connect } from 'react-redux';
import { sha256 } from 'js-sha256';
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import RNPickerSelect from 'react-native-picker-select';
import { dequal } from 'dequal';
import omit from 'lodash/omit';
import { StackNavigationOptions } from '@react-navigation/stack';

import Touch from '../../containers/Touch';
import KeyboardView from '../../containers/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../lib/methods/helpers/events';
import { FormTextInput } from '../../containers/TextInput';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import Avatar from '../../containers/Avatar';
import { setUser } from '../../actions/login';
import { CustomIcon } from '../../containers/CustomIcon';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import styles from './styles';
import { ProfileStackParamList } from '../../stacks/types';
import { Services } from '../../lib/services';
import {
	IApplicationState,
	IAvatar,
	IAvatarButton,
	IAvatarSuggestion,
	IBaseScreen,
	IProfileParams,
	IUser
} from '../../definitions';
import { twoFactor } from '../../lib/services/twoFactor';
import { TwoFactorMethods } from '../../definitions/ITotp';
import { withActionSheet, IActionSheetProvider } from '../../containers/ActionSheet';
import { DeleteAccountActionSheetContent } from './components/DeleteAccountActionSheetContent';
import ActionSheetContentWithInputAndSubmit from '../../containers/ActionSheet/ActionSheetContentWithInputAndSubmit';

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
}

interface IProfileViewState {
	saving: boolean;
	name: string;
	username: string;
	email: string | null;
	newPassword: string | null;
	currentPassword: string | null;
	avatarUrl: string | null;
	avatar: IAvatar;
	avatarSuggestions: IAvatarSuggestion;
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
	private email?: TextInput;
	private avatarUrl?: TextInput;
	private newPassword?: TextInput;

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
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

	constructor(props: IProfileViewProps) {
		super(props);
		this.setHeader();
	}

	state: IProfileViewState = {
		saving: false,
		name: '',
		username: '',
		email: '',
		newPassword: '',
		currentPassword: '',
		avatarUrl: '',
		avatar: {
			data: {},
			url: ''
		},
		avatarSuggestions: {},
		customFields: {},
		twoFactorCode: null
	};

	async componentDidMount() {
		this.init();

		try {
			const result = await Services.getAvatarSuggestion();
			this.setState({ avatarSuggestions: result });
		} catch (e) {
			log(e);
		}
	}

	UNSAFE_componentWillReceiveProps(nextProps: IProfileViewProps) {
		const { user } = this.props;
		/*
		 * We need to ignore status because on Android ImagePicker
		 * changes the activity, so, the user status changes and
		 * it's resetting the avatar right after
		 * select some image from gallery.
		 */
		if (!dequal(omit(user, ['status']), omit(nextProps.user, ['status']))) {
			this.init(nextProps.user);
		}
	}

	setAvatar = (avatar: IAvatar) => {
		const { Accounts_AllowUserAvatarChange } = this.props;

		if (!Accounts_AllowUserAvatarChange) {
			return;
		}

		this.setState({ avatar });
	};

	init = (user?: IUser) => {
		const { user: userProps } = this.props;
		const { name, username, emails, customFields } = user || userProps;

		this.setState({
			name: name as string,
			username,
			email: emails ? emails[0].address : null,
			newPassword: null,
			currentPassword: null,
			avatarUrl: null,
			avatar: {
				data: {},
				url: ''
			},
			customFields: customFields || {}
		});
	};

	formIsChanged = () => {
		const { name, username, email, newPassword, avatar, customFields } = this.state;
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
			user.name === name &&
			user.username === username &&
			!newPassword &&
			user.emails &&
			user.emails[0].address === email &&
			!avatar.data &&
			!customFieldsChanged
		);
	};

	handleError = (e: any, _func: string, action: string) => {
		if (e.data && e.data.error.includes('[error-too-many-requests]')) {
			return showErrorAlert(e.data.error);
		}
		if (I18n.isTranslated(e.error)) {
			return showErrorAlert(I18n.t(e.error));
		}
		showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }));
	};

	submit = async (): Promise<void> => {
		Keyboard.dismiss();

		if (!this.formIsChanged()) {
			return;
		}

		this.setState({ saving: true });

		const { name, username, email, newPassword, currentPassword, avatar, customFields, twoFactorCode } = this.state;
		const { user, dispatch } = this.props;
		const params = {} as IProfileParams;

		// Name
		if (user.name !== name) {
			params.name = name;
		}

		// Username
		if (user.username !== username) {
			params.username = username;
		}

		// Email
		if (user.emails && user.emails[0].address !== email) {
			params.email = email;
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
						onSubmit={(p: string) => {
							this.props.hideActionSheet();
							this.setState({ currentPassword: p }, () => this.submit());
						}}
						onCancel={this.props.hideActionSheet}
					/>
				),
				headerHeight: 225
			});
			return;
		}

		try {
			if (avatar.url) {
				try {
					logEvent(events.PROFILE_SAVE_AVATAR);
					await Services.setAvatarFromService(avatar);
				} catch (e) {
					logEvent(events.PROFILE_SAVE_AVATAR_F);
					this.setState({ saving: false, currentPassword: null });
					return this.handleError(e, 'setAvatarFromService', 'changing_avatar');
				}
			}

			const twoFactorOptions = params.currentPassword
				? {
						twoFactorCode: params.currentPassword,
						twoFactorMethod: TwoFactorMethods.PASSWORD
				  }
				: null;

			const result = await Services.saveUserProfileMethod(params, customFields, twoFactorCode || twoFactorOptions);

			if (result) {
				logEvent(events.PROFILE_SAVE_CHANGES);
				if (customFields) {
					dispatch(setUser({ customFields, ...params }));
				} else {
					dispatch(setUser({ ...params }));
				}
				EventEmitter.emit(LISTENER, { message: I18n.t('Profile_saved_successfully') });
				this.init();
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
			this.handleError(e, 'saveUserProfile', 'saving_profile');
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
			this.handleError(e, 'resetAvatar', 'changing_avatar');
		}
	};

	pickImage = async () => {
		const { Accounts_AllowUserAvatarChange } = this.props;

		if (!Accounts_AllowUserAvatarChange) {
			return;
		}

		const options = {
			cropping: true,
			compressImageQuality: 0.8,
			freeStyleCropEnabled: true,
			cropperAvoidEmptySpaceAroundImage: false,
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			includeBase64: true
		};
		try {
			logEvent(events.PROFILE_PICK_AVATAR);
			const response: Image = await ImagePicker.openPicker(options);
			this.setAvatar({ url: response.path, data: `data:image/jpeg;base64,${response.data}`, service: 'upload' });
		} catch (error) {
			logEvent(events.PROFILE_PICK_AVATAR_F);
			console.warn(error);
		}
	};

	pickImageWithURL = (avatarUrl: string) => {
		logEvent(events.PROFILE_PICK_AVATAR_WITH_URL);
		this.setAvatar({ url: avatarUrl, data: avatarUrl, service: 'url' });
	};

	renderAvatarButton = ({ key, child, onPress, disabled = false }: IAvatarButton) => {
		const { theme } = this.props;
		return (
			<Touch
				key={key}
				testID={key}
				onPress={onPress}
				style={[styles.avatarButton, { opacity: disabled ? 0.5 : 1 }, { backgroundColor: themes[theme].borderColor }]}
				enabled={!disabled}
			>
				{child}
			</Touch>
		);
	};

	renderAvatarButtons = () => {
		const { avatarUrl, avatarSuggestions } = this.state;
		const { user, theme, Accounts_AllowUserAvatarChange } = this.props;

		return (
			<View style={styles.avatarButtons}>
				{this.renderAvatarButton({
					child: <Avatar text={`@${user.username}`} size={50} />,
					onPress: () => this.resetAvatar(),
					disabled: !Accounts_AllowUserAvatarChange,
					key: 'profile-view-reset-avatar'
				})}
				{this.renderAvatarButton({
					child: <CustomIcon name='upload' size={30} color={themes[theme].bodyText} />,
					onPress: () => this.pickImage(),
					disabled: !Accounts_AllowUserAvatarChange,
					key: 'profile-view-upload-avatar'
				})}
				{this.renderAvatarButton({
					child: <CustomIcon name='link' size={30} color={themes[theme].bodyText} />,
					onPress: () => (avatarUrl ? this.pickImageWithURL(avatarUrl) : null),
					disabled: !avatarUrl,
					key: 'profile-view-avatar-url-button'
				})}
				{Object.keys(avatarSuggestions).map(service => {
					const { url, blob, contentType } = avatarSuggestions[service];
					return this.renderAvatarButton({
						disabled: !Accounts_AllowUserAvatarChange,
						key: `profile-view-avatar-${service}`,
						child: <Avatar avatar={url} size={50} />,
						onPress: () =>
							this.setAvatar({
								url,
								data: blob,
								service,
								contentType
							})
					});
				})}
			</View>
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
							value={customFields[key]}
						>
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
			children: <DeleteAccountActionSheetContent />,
			headerHeight: 225
		});
	};

	render() {
		const { name, username, email, newPassword, avatarUrl, customFields, avatar, saving } = this.state;
		const {
			user,
			theme,
			Accounts_AllowEmailChange,
			Accounts_AllowPasswordChange,
			Accounts_AllowRealNameChange,
			Accounts_AllowUserAvatarChange,
			Accounts_AllowUsernameChange,
			Accounts_CustomFields,
			Accounts_AllowDeleteOwnAccount
		} = this.props;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<SafeAreaView testID='profile-view'>
					<ScrollView contentContainerStyle={sharedStyles.containerScrollView} testID='profile-view-list' {...scrollPersistTaps}>
						<View style={styles.avatarContainer} testID='profile-view-avatar'>
							<Avatar text={user.username} avatar={avatar?.url} isStatic={avatar?.url} size={100} />
						</View>
						<FormTextInput
							editable={Accounts_AllowRealNameChange}
							inputStyle={[!Accounts_AllowRealNameChange && styles.disabled]}
							inputRef={e => {
								this.name = e;
							}}
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
							inputRef={e => {
								this.username = e;
							}}
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
							inputRef={e => {
								if (e) {
									this.email = e;
								}
							}}
							label={I18n.t('Email')}
							placeholder={I18n.t('Email')}
							value={email || undefined}
							onChangeText={value => this.setState({ email: value })}
							onSubmitEditing={() => {
								this.newPassword?.focus();
							}}
							testID='profile-view-email'
						/>
						<FormTextInput
							editable={Accounts_AllowPasswordChange}
							inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
							inputRef={e => {
								if (e) {
									this.newPassword = e;
								}
							}}
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
						<FormTextInput
							editable={Accounts_AllowUserAvatarChange}
							inputStyle={[!Accounts_AllowUserAvatarChange && styles.disabled]}
							inputRef={e => {
								if (e) {
									this.avatarUrl = e;
								}
							}}
							label={I18n.t('Avatar_Url')}
							placeholder={I18n.t('Avatar_Url')}
							value={avatarUrl || undefined}
							onChangeText={value => this.setState({ avatarUrl: value })}
							onSubmitEditing={this.submit}
							testID='profile-view-avatar-url'
						/>
						{this.renderAvatarButtons()}
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
							backgroundColor={themes[theme].chatComponentBackground}
							onPress={this.logoutOtherLocations}
							testID='profile-view-logout-other-locations'
						/>
						{Accounts_AllowDeleteOwnAccount ? (
							<Button
								title={I18n.t('Delete_my_account')}
								type='primary'
								backgroundColor={themes[theme].dangerColor}
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
	Accounts_AllowDeleteOwnAccount: state.settings.Accounts_AllowDeleteOwnAccount as boolean
});

export default connect(mapStateToProps)(withTheme(withActionSheet(ProfileView)));
