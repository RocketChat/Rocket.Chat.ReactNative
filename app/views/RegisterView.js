import React from 'react';
import PropTypes from 'prop-types';
import {
	Keyboard, Text, ScrollView, Dimensions, Alert
} from 'react-native';
import { connect, Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import SafeAreaView from 'react-native-safe-area-view';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import equal from 'deep-equal';

import { registerSubmit as registerSubmitAction } from '../actions/login';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import LoggedView from './View';
import I18n from '../i18n';
import store from '../lib/createStore';
import { DARK_HEADER } from '../constants/headerOptions';

let TermsServiceView = null;
let PrivacyPolicyView = null;
let LegalView = null;

@connect(state => ({
	server: state.server.server,
	login: state.login
}), dispatch => ({
	registerSubmit: params => dispatch(registerSubmitAction(params))
}))
/** @extends React.Component */
export default class RegisterView extends LoggedView {
	static options() {
		return {
			...DARK_HEADER,
			topBar: {
				...DARK_HEADER.topBar,
				rightButtons: [{
					id: 'more',
					icon: { uri: 'more', scale: Dimensions.get('window').scale },
					testID: 'register-view-more'
				}]
			}
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		server: PropTypes.string,
		registerSubmit: PropTypes.func.isRequired,
		Accounts_UsernamePlaceholder: PropTypes.string,
		Accounts_NamePlaceholder: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		login: PropTypes.object
	}

	constructor(props) {
		super('RegisterView', props);
		this.state = {
			name: '',
			email: '',
			password: '',
			username: ''
		};
		Navigation.events().bindComponent(this);
	}

	componentDidMount() {
		this.timeout = setTimeout(() => {
			this.nameInput.focus();
		}, 600);
	}

	componentDidUpdate(prevProps) {
		const { login, componentId, Site_Name } = this.props;
		if (login && login.failure && login.error && !equal(login.error, prevProps.login.error)) {
			Alert.alert(I18n.t('Oops'), login.error.reason);
		} else if (Site_Name && prevProps.Site_Name !== Site_Name) {
			this.setTitle(componentId, Site_Name);
		}
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	setTitle = (componentId, title) => {
		Navigation.mergeOptions(componentId, {
			topBar: {
				title: {
					text: title
				}
			}
		});
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'more') {
			if (LegalView == null) {
				LegalView = require('./LegalView').default;
				Navigation.registerComponentWithRedux('LegalView', () => gestureHandlerRootHOC(LegalView), Provider, store);
			}

			Navigation.showModal({
				stack: {
					children: [{
						component: {
							name: 'LegalView'
						}
					}]
				}
			});
		}
	}

	valid = () => {
		const {
			name, email, password, username
		} = this.state;
		return name.trim() && email.trim() && password.trim() && username.trim();
	}

	invalidEmail = () => {
		const { login } = this.props;
		return login.failure && /Email/.test(login.error && login.error.reason) ? login.error : {};
	}

	submit = () => {
		if (!this.valid()) {
			return;
		}
		const {
			name, email, password, username
		} = this.state;
		const { registerSubmit } = this.props;
		registerSubmit({
			name, email, pass: password, username
		});
		Keyboard.dismiss();
	}

	termsService = () => {
		if (TermsServiceView == null) {
			TermsServiceView = require('./TermsServiceView').default;
			Navigation.registerComponentWithRedux('TermsServiceView', () => gestureHandlerRootHOC(TermsServiceView), Provider, store);
		}

		const { componentId } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'TermsServiceView',
				options: {
					topBar: {
						title: {
							text: I18n.t('Terms_of_Service')
						}
					}
				}
			}
		});
	}

	privacyPolicy = () => {
		if (PrivacyPolicyView == null) {
			PrivacyPolicyView = require('./PrivacyPolicyView').default;
			Navigation.registerComponentWithRedux('PrivacyPolicyView', () => gestureHandlerRootHOC(PrivacyPolicyView), Provider, store);
		}

		const { componentId } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'PrivacyPolicyView',
				options: {
					topBar: {
						title: {
							text: I18n.t('Privacy_Policy')
						}
					}
				}
			}
		});
	}

	render() {
		const { login } = this.props;
		return (
			<KeyboardView contentContainerStyle={sharedStyles.container}>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='register-view' forceInset={{ bottom: 'never' }}>
						<Text style={[sharedStyles.loginTitle, sharedStyles.textBold]}>{I18n.t('Sign_Up')}</Text>
						<TextInput
							inputRef={(e) => { this.nameInput = e; }}
							placeholder={I18n.t('Name')}
							returnKeyType='next'
							iconLeft='user'
							onChangeText={name => this.setState({ name })}
							onSubmitEditing={() => { this.usernameInput.focus(); }}
							testID='register-view-name'
						/>
						<TextInput
							inputRef={(e) => { this.usernameInput = e; }}
							placeholder={I18n.t('Username')}
							returnKeyType='next'
							iconLeft='mention'
							onChangeText={username => this.setState({ username })}
							onSubmitEditing={() => { this.emailInput.focus(); }}
							testID='register-view-username'
						/>
						<TextInput
							inputRef={(e) => { this.emailInput = e; }}
							placeholder={I18n.t('Email')}
							returnKeyType='next'
							keyboardType='email-address'
							iconLeft='mail'
							onChangeText={email => this.setState({ email })}
							onSubmitEditing={() => { this.passwordInput.focus(); }}
							error={this.invalidEmail()}
							testID='register-view-email'
						/>
						<TextInput
							inputRef={(e) => { this.passwordInput = e; }}
							placeholder={I18n.t('Password')}
							returnKeyType='send'
							iconLeft='key'
							secureTextEntry
							onChangeText={value => this.setState({ password: value })}
							onSubmitEditing={this.submit}
							testID='register-view-password'
							containerStyle={sharedStyles.inputLastChild}
						/>

						<Button
							title={I18n.t('Register')}
							type='primary'
							onPress={this.submit}
							testID='register-view-submit'
							disabled={!this.valid()}
							loading={login.isFetching}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
