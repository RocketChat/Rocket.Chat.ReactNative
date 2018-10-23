import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, ScrollView } from 'react-native';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import SafeAreaView from 'react-native-safe-area-view';

import LoggedView from './View';
import { forgotPasswordInit as forgotPasswordInitAction, forgotPasswordRequest as forgotPasswordRequestAction } from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import Loading from '../containers/Loading';
import styles from './Styles';
import { showErrorAlert } from '../utils/info';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';

@connect(state => ({
	login: state.login
}), dispatch => ({
	forgotPasswordInit: () => dispatch(forgotPasswordInitAction()),
	forgotPasswordRequest: email => dispatch(forgotPasswordRequestAction(email))
}))
/** @extends React.Component */
export default class ForgotPasswordView extends LoggedView {
	static propTypes = {
		componentId: PropTypes.string,
		forgotPasswordInit: PropTypes.func.isRequired,
		forgotPasswordRequest: PropTypes.func.isRequired,
		login: PropTypes.object
	}

	constructor(props) {
		super('ForgotPasswordView', props);

		this.state = {
			email: '',
			invalidEmail: false
		};
	}

	componentDidMount() {
		const { forgotPasswordInit } = this.props;
		forgotPasswordInit();
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
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView style={styles.container} testID='forgot-password-view' forceInset={{ bottom: 'never' }}>
						<View>
							<TextInput
								inputStyle={invalidEmail ? { borderColor: 'red' } : {}}
								label={I18n.t('Email')}
								placeholder={I18n.t('Email')}
								keyboardType='email-address'
								returnKeyType='next'
								onChangeText={email => this.validate(email)}
								onSubmitEditing={() => this.resetPassword()}
								testID='forgot-password-view-email'
							/>

							<View style={styles.alignItemsFlexStart}>
								<Button
									title={I18n.t('Reset_password')}
									type='primary'
									onPress={this.resetPassword}
									testID='forgot-password-view-submit'
								/>
							</View>

							{login.failure ? <Text style={styles.error}>{login.error.reason}</Text> : null}
							<Loading visible={login.isFetching} />
						</View>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
