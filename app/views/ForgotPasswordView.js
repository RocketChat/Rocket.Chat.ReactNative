import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, SafeAreaView, ScrollView } from 'react-native';
import { connect } from 'react-redux';

import LoggedView from './View';
import { forgotPasswordInit, forgotPasswordRequest } from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import Loading from '../containers/Loading';
import styles from './Styles';
import { showErrorAlert } from '../utils/info';
import scrollPersistTaps from '../utils/scrollPersistTaps';

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
		const { email, invalidEmail } = this.state;
		if (invalidEmail || !email) {
			return;
		}
		this.props.forgotPasswordRequest(email);
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

								<View style={styles.alignItemsFlexStart}>
									<Button
										title='Reset password'
										type='primary'
										onPress={this.resetPassword}
									/>
								</View>

								{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
							</View>
							<Loading visible={this.props.login.isFetching} />
						</View>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
