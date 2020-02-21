import React from 'react';
import PropTypes from 'prop-types';
import { Keyboard, Text, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import RNPickerSelect from 'react-native-picker-select';
import equal from 'deep-equal';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import { loginRequest as loginRequestAction } from '../actions/login';
import isValidEmail from '../utils/isValidEmail';
import { LegalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import log from '../utils/log';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import { themedHeader } from '../utils/navigation';
import { isTablet } from '../utils/deviceInfo';
import { showErrorAlert } from '../utils/info';

const shouldUpdateState = ['name', 'email', 'password', 'username', 'saving'];

class RegisterView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			...themedHeader(screenProps.theme),
			title,
			headerRight: <LegalButton testID='register-view-more' navigation={navigation} />
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func,
		Site_Name: PropTypes.string,
		Accounts_CustomFields: PropTypes.string,
		Accounts_EmailVerification: PropTypes.bool,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const customFields = {};
		this.parsedCustomFields = {};
		if (props.Accounts_CustomFields) {
			try {
				this.parsedCustomFields = JSON.parse(props.Accounts_CustomFields);
			} catch (e) {
				log(e);
			}
		}
		Object.keys(this.parsedCustomFields).forEach((key) => {
			if (this.parsedCustomFields[key].defaultValue) {
				customFields[key] = this.parsedCustomFields[key].defaultValue;
			}
		});
		this.state = {
			name: '',
			email: '',
			password: '',
			username: '',
			saving: false,
			customFields
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { customFields } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!equal(nextState.customFields, customFields)) {
			return true;
		}
		// eslint-disable-next-line react/destructuring-assignment
		return shouldUpdateState.some(key => nextState[key] !== this.state[key]);
	}

	componentDidUpdate(prevProps) {
		const { Site_Name } = this.props;
		if (Site_Name && prevProps.Site_Name !== Site_Name) {
			this.setTitle(Site_Name);
		}
	}

	setTitle = (title) => {
		const { navigation } = this.props;
		navigation.setParams({ title });
	}

	valid = () => {
		const {
			name, email, password, username, customFields
		} = this.state;
		let requiredCheck = true;
		Object.keys(this.parsedCustomFields).forEach((key) => {
			if (this.parsedCustomFields[key].required) {
				requiredCheck = requiredCheck && customFields[key] && Boolean(customFields[key].trim());
			}
		});
		return name.trim() && email.trim() && password.trim() && username.trim() && isValidEmail(email) && requiredCheck;
	}

	submit = async() => {
		if (!this.valid()) {
			return;
		}
		this.setState({ saving: true });
		Keyboard.dismiss();

		const {
			name, email, password, username, customFields
		} = this.state;
		const { loginRequest, Accounts_EmailVerification, navigation } = this.props;

		try {
			await RocketChat.register({
				name, email, pass: password, username, ...customFields
			});

			if (Accounts_EmailVerification) {
				await navigation.goBack();
				showErrorAlert(I18n.t('Verify_email_desc'), I18n.t('Verify_email_title'));
			} else {
				await loginRequest({ user: email, password });
			}
		} catch (e) {
			if (e.data && e.data.errorType === 'username-invalid') {
				return loginRequest({ user: email, password });
			}
			showErrorAlert(e.data.error, I18n.t('Oops'));
		}
		this.setState({ saving: false });
	}

	renderCustomFields = () => {
		const { customFields } = this.state;
		const { Accounts_CustomFields, theme } = this.props;
		if (!Accounts_CustomFields) {
			return null;
		}
		try {
			return Object.keys(this.parsedCustomFields).map((key, index, array) => {
				if (this.parsedCustomFields[key].type === 'select') {
					const options = this.parsedCustomFields[key].options.map(option => ({ label: option, value: option }));
					return (
						<RNPickerSelect
							key={key}
							items={options}
							onValueChange={(value) => {
								const newValue = {};
								newValue[key] = value;
								this.setState({ customFields: { ...customFields, ...newValue } });
							}}
							value={customFields[key]}
						>
							<TextInput
								inputRef={(e) => { this[key] = e; }}
								placeholder={key}
								value={customFields[key]}
								iconLeft='flag'
								testID='register-view-custom-picker'
								theme={theme}
							/>
						</RNPickerSelect>
					);
				}

				return (
					<TextInput
						inputRef={(e) => { this[key] = e; }}
						key={key}
						placeholder={key}
						value={customFields[key]}
						iconLeft='flag'
						onChangeText={(value) => {
							const newValue = {};
							newValue[key] = value;
							this.setState({ customFields: { ...customFields, ...newValue } });
						}}
						onSubmitEditing={() => {
							if (array.length - 1 > index) {
								return this[array[index + 1]].focus();
							}
							this.avatarUrl.focus();
						}}
						theme={theme}
					/>
				);
			});
		} catch (error) {
			return null;
		}
	}

	render() {
		const { saving } = this.state;
		const { theme } = this.props;
		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
			>
				<StatusBar theme={theme} />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]} testID='register-view' forceInset={{ vertical: 'never' }}>
						<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Sign_Up')}</Text>
						<TextInput
							autoFocus
							placeholder={I18n.t('Name')}
							returnKeyType='next'
							iconLeft='user'
							onChangeText={name => this.setState({ name })}
							onSubmitEditing={() => { this.usernameInput.focus(); }}
							testID='register-view-name'
							theme={theme}
						/>
						<TextInput
							inputRef={(e) => { this.usernameInput = e; }}
							placeholder={I18n.t('Username')}
							returnKeyType='next'
							iconLeft='at'
							onChangeText={username => this.setState({ username })}
							onSubmitEditing={() => { this.emailInput.focus(); }}
							testID='register-view-username'
							theme={theme}
						/>
						<TextInput
							inputRef={(e) => { this.emailInput = e; }}
							placeholder={I18n.t('Email')}
							returnKeyType='next'
							keyboardType='email-address'
							iconLeft='mail'
							onChangeText={email => this.setState({ email })}
							onSubmitEditing={() => { this.passwordInput.focus(); }}
							testID='register-view-email'
							theme={theme}
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
							theme={theme}
						/>

						{this.renderCustomFields()}

						<Button
							title={I18n.t('Register')}
							type='primary'
							onPress={this.submit}
							testID='register-view-submit'
							disabled={!this.valid()}
							loading={saving}
							theme={theme}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	Accounts_EmailVerification: state.settings.Accounts_EmailVerification
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RegisterView));
