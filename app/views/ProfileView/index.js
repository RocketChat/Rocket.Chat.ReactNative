import React from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView, SafeAreaView, Keyboard } from 'react-native';
import { connect } from 'react-redux';
import Dialog from 'react-native-dialog';
import SHA256 from 'js-sha256';

import LoggedView from '../View';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, showToast } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import RCTextInput from '../../containers/TextInput';
import Loading from '../../containers/Loading';
import log from '../../utils/log';
import I18n from '../../i18n';
import Button from '../../containers/Button';

@connect(state => ({
	user: state.login.user
}))
export default class ProfileView extends LoggedView {
	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.object
	};

	constructor(props) {
		super('ProfileView', props);
		this.state = {
			showPasswordAlert: false,
			saving: false,
			name: null,
			username: null,
			email: null,
			newPassword: null,
			typedPassword: null,
			avatarUrl: null
		};
	}

	componentDidMount() {
		this.init();
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.user !== nextProps.user) {
			this.init(nextProps.user);
		}
	}

	init = (user) => {
		const {
			name, username, emails
		} = user || this.props.user;
		this.setState({
			name,
			username,
			email: emails ? emails[0].address : null,
			newPassword: null,
			typedPassword: null
		});
	}

	formIsChanged = () => {
		const {
			name, username, email, newPassword
		} = this.state;
		const { user } = this.props;
		return !(user.name === name &&
			user.username === username &&
			!newPassword &&
			(user.emails && user.emails[0].address === email)
		);
	}

	closePasswordAlert = () => {
		this.setState({ showPasswordAlert: false });
	}

	submit = async() => {
		Keyboard.dismiss();
		this.setState({ saving: true, showPasswordAlert: false });

		const {
			name, username, email, newPassword, typedPassword
		} = this.state;
		const { user } = this.props;

		if (!this.formIsChanged()) {
			return;
		}

		const params = {};

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

		// newPassword
		if (newPassword) {
			params.newPassword = newPassword;
		}

		// typedPassword
		if (typedPassword) {
			params.typedPassword = SHA256(typedPassword);
		}

		const requirePassword = !!params.email || newPassword;
		if (requirePassword && !params.typedPassword) {
			return this.setState({ showPasswordAlert: true, saving: false });
		}

		try {
			await RocketChat.saveUserProfile(params);
			this.setState({ saving: false });
			setTimeout(() => {
				showToast(I18n.t('Settings_succesfully_changed'));
				this.init();
			}, 300);
		} catch (e) {
			this.setState({ saving: false, typedPassword: null });
			setTimeout(() => {
				if (e && e.error) {
					return showErrorAlert(I18n.t(e.error, e.details));
				}
				showErrorAlert(I18n.t('There_was_an_error_while_saving_settings'));
				log('saveRoomSettings', e);
			}, 300);
		}
	}

	render() {
		const {
			name, username, email, newPassword, avatarUrl
		} = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='profile-view-list'
					{...scrollPersistTaps}
				>
					<SafeAreaView testID='profile-view'>
						<View style={sharedStyles.formContainer}>
							<RCTextInput
								inputRef={(e) => { this.name = e; }}
								label={I18n.t('Name')}
								placeholder={I18n.t('Name')}
								value={name}
								onChangeText={value => this.setState({ name: value })}
								onSubmitEditing={() => { this.username.focus(); }}
								testID='profile-view-name'
							/>
							<RCTextInput
								inputRef={(e) => { this.username = e; }}
								label={I18n.t('Username')}
								placeholder={I18n.t('Username')}
								value={username}
								onChangeText={value => this.setState({ username: value })}
								onSubmitEditing={() => { this.email.focus(); }}
								testID='profile-view-username'
							/>
							<RCTextInput
								inputRef={(e) => { this.email = e; }}
								label={I18n.t('Email')}
								placeholder={I18n.t('Email')}
								value={email}
								onChangeText={value => this.setState({ email: value })}
								onSubmitEditing={() => { this.newPassword.focus(); }}
								testID='profile-view-email'
							/>
							<RCTextInput
								inputRef={(e) => { this.newPassword = e; }}
								label={I18n.t('New_Password')}
								placeholder={I18n.t('New_Password')}
								value={newPassword}
								onChangeText={value => this.setState({ newPassword: value })}
								onSubmitEditing={() => { this.avatarUrl.focus(); }}
								secureTextEntry
								testID='profile-view-new-password'
							/>
							<RCTextInput
								inputRef={(e) => { this.avatarUrl = e; }}
								label={I18n.t('Avatar_Url')}
								placeholder={I18n.t('Avatar_Url')}
								value={avatarUrl}
								onChangeText={value => this.setState({ avatarUrl: value })}
								onSubmitEditing={this.submit}
								testID='profile-view-avatar-url'
							/>
							<View style={sharedStyles.alignItemsFlexStart}>
								<Button
									title={I18n.t('Save_Changes')}
									type='primary'
									onPress={this.submit}
									disabled={!this.formIsChanged()}
									testID='new-server-view-button'
								/>
							</View>
						</View>
						<Loading visible={this.state.saving} />
						<Dialog.Container visible={this.state.showPasswordAlert}>
							<Dialog.Title>
								{I18n.t('Please_enter_your_password')}
							</Dialog.Title>
							<Dialog.Description>
								{I18n.t('For_your_security_you_must_enter_your_current_password_to_continue')}
							</Dialog.Description>
							<Dialog.Input
								onChangeText={value => this.setState({ typedPassword: value })}
								secureTextEntry
							/>
							<Dialog.Button label={I18n.t('Cancel')} onPress={this.closePasswordAlert} />
							<Dialog.Button label={I18n.t('Save')} onPress={this.submit} />
						</Dialog.Container>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
