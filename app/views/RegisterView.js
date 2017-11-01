import React from 'react';

import Spinner from 'react-native-loading-spinner-overlay';

import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, View, TouchableOpacity, Image } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as loginActions from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';

import styles from './Styles';

const placeholderTextColor = 'rgba(255,255,255,.2)';

class RegisterView extends React.Component {
	static propTypes = {
		registerSubmit: PropTypes.func.isRequired,
		Accounts_UsernamePlaceholder: PropTypes.string,
		Accounts_NamePlaceholder: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		Accounts_RepeatPasswordPlaceholder: PropTypes.string,
		login: PropTypes.object,
		navigation: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);

		this.state = {
			name: '',
			username: '',
			email: '',
			password: '',
			confirmPassword: ''
		};
	}

	componentDidUpdate(prevProps) {
		if (!this.props.login.isFetching && prevProps.login.isFetching &&
				!this.props.login.failure) {
			this.props.navigation.goBack();
		}
	}
	_valid() {
		const { name, username, email, password, confirmPassword } = this.state;
		return name.trim() && username.trim() && email.trim() &&
			password && confirmPassword && password === confirmPassword;
	}
	_invalidEmail() {
		return this.props.login.failure && /Email/.test(this.props.login.error.reason);
	}
	submit = () => {
		const { name, username, email, password, code } = this.state;
		if (!this._valid()) {
			return;
		}

		this.props.registerSubmit({ name, username, email, pass: password, code });
		Keyboard.dismiss();
	}

	render() {
		return (
			<KeyboardView contentContainerStyle={styles.container} keyboardVerticalOffset={150}>
				<View style={styles.logoContainer}>
					<Image
						style={styles.registerLogo}
						source={require('../images/logo_with_text.png')}
					/>
				</View>
				<View style={styles.loginView}>
					<View style={styles.formContainer}>
						<TextInput
							ref={(e) => { this.name = e; }}
							placeholderTextColor={placeholderTextColor}
							style={styles.input}
							onChangeText={name => this.setState({ name })}
							autoCorrect={false}
							autoFocus
							returnKeyType='next'
							autoCapitalize='none'

							underlineColorAndroid='transparent'
							onSubmitEditing={() => { this.username.focus(); }}
							placeholder={this.props.Accounts_NamePlaceholder || 'Name'}
						/>

						<TextInput
							ref={(e) => { this.username = e; }}
							placeholderTextColor={'rgba(255,255,255,.2)'}
							style={styles.input}
							onChangeText={username => this.setState({ username })}
							autoCorrect={false}
							returnKeyType='next'
							autoCapitalize='none'

							underlineColorAndroid='transparent'
							onSubmitEditing={() => { this.email.focus(); }}
							placeholder={this.props.Accounts_UsernamePlaceholder || 'Username'}
						/>

						<TextInput
							ref={(e) => { this.email = e; }}
							placeholderTextColor={placeholderTextColor}
							style={[styles.input, this._invalidEmail() ? { borderColor: 'red' } : {}]}
							onChangeText={email => this.setState({ email })}
							keyboardType='email-address'
							autoCorrect={false}
							returnKeyType='next'
							autoCapitalize='none'

							underlineColorAndroid='transparent'
							onSubmitEditing={() => { this.password.focus(); }}
							placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email'}
						/>
						<TextInput
							ref={(e) => { this.password = e; }}
							placeholderTextColor={placeholderTextColor}
							style={styles.input}
							onChangeText={password => this.setState({ password })}
							secureTextEntry
							autoCorrect={false}
							returnKeyType='next'
							autoCapitalize='none'

							underlineColorAndroid='transparent'
							onSubmitEditing={() => { this.confirmPassword.focus(); }}
							placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
						/>
						<TextInput
							ref={(e) => { this.confirmPassword = e; }}
							placeholderTextColor={placeholderTextColor}
							style={[styles.input, this.state.password && this.state.confirmPassword && this.state.confirmPassword !== this.state.password ? { borderColor: 'red' } : {}]}
							onChangeText={confirmPassword => this.setState({ confirmPassword })}
							secureTextEntry
							autoCorrect={false}
							returnKeyType='done'
							autoCapitalize='none'

							underlineColorAndroid='transparent'
							onSubmitEditing={this.submit}
							placeholder={this.props.Accounts_RepeatPasswordPlaceholder || 'Repeat Password'}
						/>

						<TouchableOpacity style={[styles.buttonContainer, styles.registerContainer]}>
							<Text
								style={[styles.button, this._valid() ? {}
									: { color: placeholderTextColor }
								]}
								onPress={this.submit}
							>REGISTER</Text>
						</TouchableOpacity>

						{this.props.login.failure && <Text style={styles.error}>{this.props.login.error.reason}</Text>}
					</View>
					<Spinner visible={this.props.login.isFetching} textContent={'Loading...'} textStyle={{ color: '#FFF' }} />
				</View>
			</KeyboardView>
		);
	}
}

function mapStateToProps(state) {
	// console.log(Object.keys(state));
	return {
		server: state.server.server,
		Accounts_UsernamePlaceholder: state.settings.Accounts_UsernamePlaceholder,
		Accounts_NamePlaceholder: state.settings.Accounts_NamePlaceholder,
		Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
		Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
		Accounts_RepeatPasswordPlaceholder: state.settings.Accounts_RepeatPasswordPlaceholder,
		login: state.login
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(loginActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RegisterView);
