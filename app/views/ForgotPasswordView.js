import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import PropTypes from 'prop-types';
import { Text, View, SafeAreaView, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import TinyColor from 'tinycolor2';

import LoggedView from './View';
import { forgotPasswordInit, forgotPasswordRequest } from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import styles from './Styles';
import { showErrorAlert } from '../utils/info';
import Touch from '../utils/touch';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { COLOR_BUTTON_PRIMARY } from '../constants/colors';

@connect(state => ({
	login: state.login
}), dispatch => ({
	forgotPasswordInit: () => dispatch(forgotPasswordInit()),
	forgotPasswordRequest: email => dispatch(forgotPasswordRequest(email))
}))
export default class ForgotPasswordView extends LoggedView {
	static propTypes = {
		forgotPasswordInit: PropTypes.func.isRequired,
		forgotPasswordRequest: PropTypes.func.isRequired,
		login: PropTypes.object,
		navigation: PropTypes.object.isRequired
	}

	constructor(props) {
		super('ForgotPasswordView', props);

		this.state = {
			email: '',
			invalidEmail: false
		};
	}

	componentDidMount() {
		this.props.forgotPasswordInit();
	}

	componentDidUpdate() {
		const { login } = this.props;
		if (login.success) {
			this.props.navigation.goBack();
			setTimeout(() => {
				showErrorAlert(
					'If this email is registered, ' +
					'we\'ll send instructions on how to reset your password. ' +
					'If you do not receive an email shortly, please come back and try again.',
					'Alert'
				);
			});
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
		if (this.state.invalidEmail) {
			return;
		}
		this.props.forgotPasswordRequest(this.state.email);
	}

	backLogin = () => {
		this.props.navigation.goBack();
	}

	render() {
		return (
			<KeyboardView
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView>
						<View style={styles.loginView}>
							<View style={styles.formContainer}>
								<TextInput
									inputStyle={this.state.invalidEmail ? { borderColor: 'red' } : {}}
									label='Email'
									placeholder='Email'
									keyboardType='email-address'
									returnKeyType='next'
									onChangeText={email => this.validate(email)}
									onSubmitEditing={() => this.resetPassword()}
								/>

								<View style={[styles.marginBottom10, { alignItems: 'flex-start' }]}>
									<Touch
										onPress={this.resetPassword}
										accessibilityTraits='button'
										underlayColor={TinyColor(COLOR_BUTTON_PRIMARY).lighten(50)}
									>
										<View style={[styles.loginButtonContainer, styles.loginButtonPrimary]}>
											<Text style={styles.loginButtonText}>Reset password</Text>
										</View>
									</Touch>
								</View>

								{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
							</View>
							<Spinner visible={this.props.login.isFetching} textContent='Loading...' textStyle={{ color: '#FFF' }} />
						</View>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
