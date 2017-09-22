import React from 'react';

import Spinner from 'react-native-loading-spinner-overlay';

import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, View, Image, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// import * as actions from '../actions';
import * as loginActions from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';
// import { Keyboard } from 'react-native'

import styles from './Styles';

class RegisterView extends React.Component {
	static propTypes = {
		registerSubmit: PropTypes.func.isRequired,
		Accounts_NamePlaceholder: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		Accounts_UsernamePlaceholder: PropTypes.string,
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

	submit = () => {
		const {	name, username, email, password, confirmPassword, code } = this.state;
		if (name.trim() === '' || email.trim() === '' || username.trim() === '' ||
			password.trim() === '' || confirmPassword.trim() === '') {
			return;
		}

		this.props.registerSubmit({ name, username, email, pass: password, code });
		Keyboard.dismiss();
	}

	renderTOTP = () => {
		if (this.props.login.errorMessage && this.props.login.errorMessage.error === 'totp-required') {
			return (
				<TextInput
					ref={ref => this.codeInput = ref}
					style={styles.input}
					onChangeText={code => this.setState({ code })}
					keyboardType='numeric'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					placeholder='Code'
				/>
			);
		}
	}

	// {this.props.login.isFetching && <Text> LOGANDO</Text>}
	render() {
		return (
			<KeyboardView style={styles.container} keyboardVerticalOffset={150}>
				<View style={styles.loginView}>
					<View style={styles.formContainer}>
						<TextInput
							ref={(e) => { this.name = e; }}
							placeholderTextColor={'rgba(255,255,255,.2)'}
							style={styles.input}
							onChangeText={name => this.setState({ name })}
							autoCorrect={false}
							returnKeyType='next'
							autoCapitalize='words'

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
							placeholderTextColor={'rgba(255,255,255,.2)'}
							style={styles.input}
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
							placeholderTextColor={'rgba(255,255,255,.2)'}
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
							placeholderTextColor={'rgba(255,255,255,.2)'}
							style={styles.input}
							onChangeText={confirmPassword => this.setState({ confirmPassword })}
							secureTextEntry
							autoCorrect={false}
							returnKeyType='done'
							autoCapitalize='none'

							underlineColorAndroid='transparent'
							onSubmitEditing={this.submit}
							placeholder={this.props.Accounts_RepeatPasswordPlaceholder || 'Repeat Password'}
						/>

						{this.renderTOTP()}

						<TouchableOpacity style={styles.buttonContainer}>
							<Text style={styles.button} onPress={this.submit}>REGISTER</Text>
						</TouchableOpacity>

						{this.props.login.error && <Text style={styles.error}>{this.props.login.error}</Text>}
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
