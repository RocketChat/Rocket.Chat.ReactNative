import React from 'react';
import PropTypes from 'prop-types';
import { Text, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import SafeAreaView from 'react-native-safe-area-view';

import LoggedView from './View';
import { forgotPasswordRequest as forgotPasswordRequestAction } from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import { showErrorAlert } from '../utils/info';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import { DARK_HEADER } from '../constants/headerOptions';

@connect(state => ({
	login: state.login
}), dispatch => ({
	forgotPasswordRequest: email => dispatch(forgotPasswordRequestAction(email))
}))
/** @extends React.Component */
export default class ForgotPasswordView extends LoggedView {
	static options() {
		return {
			...DARK_HEADER
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		forgotPasswordRequest: PropTypes.func.isRequired,
		login: PropTypes.object
	}

	constructor(props) {
		super('ForgotPasswordView', props);

		this.state = {
			email: '',
			invalidEmail: true
		};
	}

	componentDidMount() {
		this.timeout = setTimeout(() => {
			this.emailInput.focus();
		}, 600);
	}

	componentDidUpdate() {
		const { login, componentId } = this.props;
		if (login.success) {
			Navigation.pop(componentId);
			setTimeout(() => {
				showErrorAlert(I18n.t('Forgot_password_If_this_email_is_registered'), I18n.t('Alert'));
			});
		}
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	validate = (email) => {
		/* eslint-disable no-useless-escape */
		const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!reg.test(email)) {
			this.setState({ invalidEmail: true });
			return;
		}
		this.setState({ email, invalidEmail: false });
	}

	resetPassword = () => {
		const { email, invalidEmail } = this.state;
		const { forgotPasswordRequest } = this.props;
		if (invalidEmail || !email) {
			return;
		}
		forgotPasswordRequest(email);
	}

	render() {
		const { invalidEmail } = this.state;
		const { login } = this.props;

		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
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
							loading={login.isFetching}
							disabled={invalidEmail}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
