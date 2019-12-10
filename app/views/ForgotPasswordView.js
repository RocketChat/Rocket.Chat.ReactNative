import React from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import PropTypes from 'prop-types';

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
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import { themedHeader } from '../utils/navigation';

class ForgotPasswordView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			title,
			...themedHeader(screenProps.theme)
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	state = {
		email: '',
		invalidEmail: true,
		isFetching: false
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { email, invalidEmail, isFetching } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
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
		const { theme } = this.props;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar theme={theme} />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='forgot-password-view' forceInset={{ vertical: 'never' }}>
						<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Forgot_password')}</Text>
						<TextInput
							autoFocus
							placeholder={I18n.t('Email')}
							keyboardType='email-address'
							iconLeft='mail'
							returnKeyType='send'
							onChangeText={email => this.validate(email)}
							onSubmitEditing={this.resetPassword}
							testID='forgot-password-view-email'
							containerStyle={sharedStyles.inputLastChild}
							theme={theme}
						/>
						<Button
							title={I18n.t('Reset_password')}
							type='primary'
							onPress={this.resetPassword}
							testID='forgot-password-view-submit'
							loading={isFetching}
							disabled={invalidEmail}
							theme={theme}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

export default withTheme(ForgotPasswordView);
