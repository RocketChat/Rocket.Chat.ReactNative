import React from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, Keyboard, Alert
} from 'react-native';
import { connect } from 'react-redux';
import prompt from 'react-native-prompt-android';
import SHA256 from 'js-sha256';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import { Avatar, AvatarList } from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, showConfirmationAlert } from '../../utils/info';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import RocketChat from '../../lib/rocketchat';
import log, { logEvent, events } from '../../utils/log';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import { setUser as setUserAction } from '../../actions/login';
import * as HeaderButton from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { getUserSelector } from '../../selectors/login';
import SafeAreaView from '../../containers/SafeAreaView';
import FormProfile from './FormProfile';

class ProfileView extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		Accounts_AllowEmailChange: PropTypes.bool,
		Accounts_AllowPasswordChange: PropTypes.bool,
		Accounts_AllowRealNameChange: PropTypes.bool,
		Accounts_AllowUserAvatarChange: PropTypes.bool,
		Accounts_AllowUsernameChange: PropTypes.bool,
		Accounts_CustomFields: PropTypes.string,
		setUser: PropTypes.func,
		theme: PropTypes.string,
		navigation: PropTypes.object,
		isMasterDetail: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.setHeader();
	}

	state = {
		saving: false,
		name: null,
		username: null,
		email: null,
		newPassword: null,
		currentPassword: null,
		avatarUrl: null,
		avatar: {},
		avatarSuggestions: {},
		customFields: {}
	}

	async componentDidMount() {
		this.init();
		try {
			const result = await RocketChat.getAvatarSuggestion();
			this.setState({ avatarSuggestions: result });
		} catch (e) {
			log(e);
		}
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		const { user } = this.props;
		/*
		 * We need to ignore status because on Android ImagePicker
		 * changes the activity, so, the user status changes and
		 * it's resetting the avatar right after
		 * select some image from gallery.
		 */
		if (!isEqual(omit(user, ['status']), omit(nextProps.user, ['status']))) {
			this.init(nextProps.user);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!isEqual(nextState, this.state)) {
			return true;
		}
		if (!isEqual(nextProps, this.props)) {
			return true;
		}
		return false;
	}

	init = (user) => {
		const { user: userProps } = this.props;
		const {
			name, username, emails, customFields
		} = user || userProps;
		this.setState({
			name,
			username,
			email: emails ? emails[0].address : null,
			newPassword: null,
			currentPassword: null,
			avatarUrl: null,
			avatar: {},
			customFields: customFields || {}
		});
	}

	setHeader = () => {
		const { navigation, isMasterDetail } = this.props;
		navigation.setOptions({
			title: I18n.t('Profile'),
			headerLeft: !isMasterDetail ? () => (
				<HeaderButton.Drawer onPress={() => {
					if (this.formIsChanged()) {
						Alert.alert(
							'Unsaved Changes',
							'Changes will be discarded',
							[
								{
									text: 'Discard',
									style: 'destructive',
									onPress: () => {
										this.init();
										navigation.toggleDrawer();
									}
								},
								{
									text: 'Save',
									onPress: () => this.submit(),
									style: 'default'
								}
							],
							{ cancelable: false }
						);
					} else {
						navigation.toggleDrawer();
					}
				}}
				/>
			) : null,
			headerRight: () => <HeaderButton.Preferences onPress={() => navigation.navigate('UserPreferencesView')} testID='preferences-view-open' />
		});
	}

	formIsChanged = () => {
		const {
			name, username, email, newPassword, avatar, customFields
		} = this.state;
		const { user } = this.props;
		let customFieldsChanged = false;
		const customFieldsKeys = Object.keys(customFields);
		if (customFieldsKeys.length) {
			customFieldsKeys.forEach((key) => {
				if (!user.customFields || user.customFields[key] !== customFields[key]) {
					customFieldsChanged = true;
				}
			});
		}
		return !(user.name === name
			&& user.username === username
			&& !newPassword
			&& (user.emails && user.emails[0].address === email)
			&& !avatar.data
			&& !customFieldsChanged
		);
	}

	handleError = (e, func, action) => {
		if (e.data && e.data.error.includes('[error-too-many-requests]')) {
			return showErrorAlert(e.data.error);
		}
		showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }));
	}

	submit = async() => {
		Keyboard.dismiss();
		if (!this.formIsChanged()) {
			return;
		}
		this.setState({ saving: true });
		const {
			name, username, email, newPassword, currentPassword, avatar, customFields
		} = this.state;
		const { user, setUser } = this.props;
		const params = {};

		if (user.name !== name) {
			params.name = name;
		}

		if (user.username !== username) {
			params.username = username;
		}

		if (user.emails && user.emails[0].address !== email) {
			params.email = email;
		}

		if (newPassword) {
			params.newPassword = newPassword;
		}

		if (currentPassword) {
			params.currentPassword = SHA256(currentPassword);
		}
		const requirePassword = !!params.email || newPassword;
		if (requirePassword && !params.currentPassword) {
			this.setState({ saving: false });
			prompt(
				I18n.t('Please_enter_your_password'),
				I18n.t('For_your_security_you_must_enter_your_current_password_to_continue'),
				[
					{ text: I18n.t('Cancel'), onPress: () => {}, style: 'cancel' },
					{
						text: I18n.t('Save'),
						onPress: (p) => {
							this.setState({ currentPassword: p });
							this.submit();
						}
					}
				],
				{
					type: 'secure-text',
					cancelable: false
				}
			);
			return;
		}

		try {
			if (avatar.url) {
				try {
					logEvent(events.PROFILE_SAVE_AVATAR);
					await RocketChat.setAvatarFromService(avatar);
				} catch (e) {
					logEvent(events.PROFILE_SAVE_AVATAR_F);
					this.setState({ saving: false, currentPassword: null });
					return this.handleError(e, 'setAvatarFromService', 'changing_avatar');
				}
			}

			const result = await RocketChat.saveUserProfile(params, customFields);

			if (result.success) {
				logEvent(events.PROFILE_SAVE_CHANGES);
				if (customFields) {
					setUser({ customFields, ...params });
				} else {
					setUser({ ...params });
				}
				EventEmitter.emit(LISTENER, { message: I18n.t('Profile_saved_successfully') });
				this.init();
			}
			this.setState({ saving: false });
		} catch (e) {
			logEvent(events.PROFILE_SAVE_CHANGES_F);
			this.setState({ saving: false, currentPassword: null });
			this.handleError(e, 'saveUserProfile', 'saving_profile');
		}
	}

	logoutOtherLocations = () => {
		logEvent(events.PL_OTHER_LOCATIONS);
		showConfirmationAlert({
			message: I18n.t('You_will_be_logged_out_from_other_locations'),
			confirmationText: I18n.t('Logout'),
			onPress: async() => {
				try {
					await RocketChat.logoutOtherLocations();
					EventEmitter.emit(LISTENER, { message: I18n.t('Logged_out_of_other_clients_successfully') });
				} catch {
					logEvent(events.PL_OTHER_LOCATIONS_F);
					EventEmitter.emit(LISTENER, { message: I18n.t('Logout_failed') });
				}
			}
		});
	}

	setField = (value) => {
		this.setState(value);
	}

	render() {
		const {
			name, username, email, newPassword, avatarUrl, avatarSuggestions, customFields, avatar, saving
		} = this.state;
		const {
			user,
			theme,
			Accounts_AllowEmailChange,
			Accounts_AllowPasswordChange,
			Accounts_AllowRealNameChange,
			Accounts_AllowUserAvatarChange,
			Accounts_AllowUsernameChange,
			Accounts_CustomFields
		} = this.props;
		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<SafeAreaView testID='profile-view'>
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='profile-view-list'
						{...scrollPersistTaps}
					>
						<Avatar
							text={user.username}
							avatar={avatar?.url}
							isStatic={avatar?.url}
							size={100}
						/>
						<FormProfile
							Accounts_AllowEmailChange={Accounts_AllowEmailChange}
							Accounts_AllowPasswordChange={Accounts_AllowPasswordChange}
							Accounts_AllowRealNameChange={Accounts_AllowRealNameChange}
							Accounts_AllowUserAvatarChange={Accounts_AllowUserAvatarChange}
							Accounts_AllowUsernameChange={Accounts_AllowUsernameChange}
							Accounts_CustomFields={Accounts_CustomFields}
							customFields={customFields}
							avatarUrl={avatarUrl}
							email={email}
							name={name}
							newPassword={newPassword}
							setState={this.setField}
							submit={this.submit}
							theme={theme}
							username={username}
							state={this.state}
						/>
						<AvatarList
							user={user}
							allowUserAvatar={Accounts_AllowUserAvatarChange}
							setState={this.setField}
							init={this.init}
							handleError={this.handleError}
							theme={theme}
							avatarSuggestions={avatarSuggestions}
							avatarUrl={avatarUrl}
						/>
						<Button
							title={I18n.t('Save_Changes')}
							type='primary'
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='profile-view-submit'
							loading={saving}
							theme={theme}
						/>
						<Button
							title={I18n.t('Logout_from_other_logged_in_locations')}
							type='secondary'
							backgroundColor={themes[theme].chatComponentBackground}
							onPress={this.logoutOtherLocations}
							testID='profile-view-logout-other-locations'
							theme={theme}
						/>
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	Accounts_AllowEmailChange: state.settings.Accounts_AllowEmailChange,
	Accounts_AllowPasswordChange: state.settings.Accounts_AllowPasswordChange,
	Accounts_AllowRealNameChange: state.settings.Accounts_AllowRealNameChange,
	Accounts_AllowUserAvatarChange: state.settings.Accounts_AllowUserAvatarChange,
	Accounts_AllowUsernameChange: state.settings.Accounts_AllowUsernameChange,
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	baseUrl: state.server.server
});
const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(ProfileView));
