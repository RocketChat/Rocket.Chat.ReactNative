import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import PropTypes from 'prop-types';
import { Keyboard, Text, ScrollView, SafeAreaView, View } from 'react-native';
import { connect } from 'react-redux';
import { Answers } from 'react-native-fabric';
import TinyColor from 'tinycolor2';

import RocketChat from '../lib/rocketchat';
import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import CloseModalButton from '../containers/CloseModalButton';
import Touch from '../utils/touch';
import styles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import { showToast } from '../utils/info';
import { COLOR_BUTTON_PRIMARY } from '../constants/colors';

@connect(state => ({
	server: state.server.server,
	login: state.login
}), () => ({
	loginSubmit: params => RocketChat.loginWithPassword(params)
}))
export default class LoginView extends React.Component {
	static propTypes = {
		loginSubmit: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		login: PropTypes.object,
		server: PropTypes.string
	}

	state = {
		username: '',
		password: ''
	};

	submit = async() => {
		const {	username, password, code } = this.state;
		if (username.trim() === '' || password.trim() === '') {
			showToast('Email or password field is empty');
			return;
		}
		Keyboard.dismiss();

		try {
			await this.props.loginSubmit({ username, password, code });
			Answers.logLogin('Email', true, { server: this.props.server });
		} catch (error) {
			console.warn('LoginView submit', error);
		}
	}

	renderTOTP = () => {
		if (/totp/ig.test(this.props.login.error.error)) {
			return (
				<TextInput
					inputRef={ref => this.codeInput = ref}
					label='Code'
					onChangeText={code => this.setState({ code })}
					placeholder='Code'
					keyboardType='numeric'
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
				/>
			);
		}
		return null;
	}

	render() {
		return (
			<KeyboardView
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<ScrollView {...scrollPersistTaps}>
					<SafeAreaView>
						<CloseModalButton navigation={this.props.navigation} />
						<Text style={[styles.loginText, styles.loginTitle]}>Login</Text>
						<TextInput
							label='Username'
							placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Username'}
							keyboardType='email-address'
							returnKeyType='next'
							iconLeft='at'
							onChangeText={username => this.setState({ username })}
							onSubmitEditing={() => { this.password.focus(); }}
						/>

						<TextInput
							inputRef={(e) => { this.password = e; }}
							label='Password'
							placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
							returnKeyType='done'
							iconLeft='key-variant'
							secureTextEntry
							onSubmitEditing={this.submit}
							onChangeText={password => this.setState({ password })}
						/>

						{this.renderTOTP()}

						<View style={{ alignItems: 'flex-start' }}>
							<Touch
								style={[styles.loginButtonContainer, styles.marginBottom10, styles.loginButtonPrimary]}
								onPress={this.submit}
								accessibilityTraits='button'
								underlayColor={TinyColor(COLOR_BUTTON_PRIMARY).darken(20)}
							>
								<Text style={styles.loginButtonText}>Login</Text>
							</Touch>
							<Text style={[styles.loginText, { marginTop: 10 }]}>New in Rocket.Chat? &nbsp;
								<Text
									style={{ color: COLOR_BUTTON_PRIMARY }}
									onPress={() => this.props.navigation.navigate('Register')}
								>Sign Up
								</Text>
							</Text>
							<Text
								style={[styles.loginText, { marginTop: 20, fontSize: 13 }]}
								onPress={() => this.props.navigation.navigate('ForgotPassword')}
							>Forgot password
							</Text>
						</View>

						{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
						<Spinner visible={this.props.login.isFetching} textContent='Loading...' textStyle={{ color: '#FFF' }} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
