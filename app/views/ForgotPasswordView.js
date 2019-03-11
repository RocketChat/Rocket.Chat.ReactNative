import React from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import PropTypes from 'prop-types';

import LoggedView from './View';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import { showErrorAlert } from '../utils/info';
import isValidEmail from '../utils/isValidEmail';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import StatusBar from '../containers/StatusBar';

/** @extends React.Component */
export default class ForgotPasswordView extends LoggedView {
	static navigationOptions = ({ navigation }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			title
		};
	}

	static propTypes = {
		navigation: PropTypes.object
	}

	constructor(props) {
		super('ForgotPasswordView', props);

		this.state = {
			email: '',
			invalidEmail: true,
			isFetching: false
		};
	}

	componentDidMount() {
		this.timeout = setTimeout(() => {
			this.emailInput.focus();
		}, 600);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { email, invalidEmail, isFetching } = this.state;
		if (nextState.email !== email) {
			return true;
		}
		if (nextState.invalidEmail !== invalidEmail) {
			return true;
		}
		if (nextState.isFetching !== isFetching) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	validate = (email) => {
		if (!isValidEmail(email)) {
			this.setState({ invalidEmail: true });
			return;
		}
		this.setState({ email, invalidEmail: false });
	}

	resetPassword = async() => {
		const { email, invalidEmail } = this.state;
		if (invalidEmail || !email) {
			return;
		}
		try {
			this.setState({ isFetching: true });
			const result = await RocketChat.forgotPassword(email);
			if (result.success) {
				const { navigation } = this.props;
				navigation.pop();
				showErrorAlert(I18n.t('Forgot_password_If_this_email_is_registered'), I18n.t('Alert'));
			}
		} catch (e) {
			const msg = (e.data && e.data.error) || I18n.t('There_was_an_error_while_action', I18n.t('resetting_password'));
			showErrorAlert(msg, I18n.t('Alert'));
		}
		this.setState({ isFetching: false });
	}

	render() {
		const { invalidEmail, isFetching } = this.state;

		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='forgot-password-view' forceInset={{ bottom: 'never' }}>
						<Text style={[sharedStyles.loginTitle, sharedStyles.textBold]}>{I18n.t('Forgot_password')}</Text>
						<TextInput
							inputRef={(e) => { this.emailInput = e; }}
							placeholder={I18n.t('Email')}
							keyboardType='email-address'
							iconLeft='mail'
							returnKeyType='send'
							onChangeText={email => this.validate(email)}
							onSubmitEditing={this.resetPassword}
							testID='forgot-password-view-email'
							containerStyle={sharedStyles.inputLastChild}
						/>
						<Button
							title={I18n.t('Reset_password')}
							type='primary'
							onPress={this.resetPassword}
							testID='forgot-password-view-submit'
							loading={isFetching}
							disabled={invalidEmail}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
