import React from 'react';

import Spinner from 'react-native-loading-spinner-overlay';

import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, View, Image, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// import * as actions from '../actions';
import * as loginActions from '../actions/login';
import KeyboardView from '../components/KeyboardView';
// import { Keyboard } from 'react-native'

import styles from './Styles';

class LoginView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		loginSubmit: PropTypes.func.isRequired,
		server: PropTypes.string.isRequired,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		login: PropTypes.object
	}

	static navigationOptions = () => ({
		title: 'Login'
	});

	constructor(props) {
		super(props);

		this.state = {
			username: '',
			password: ''
		};
	}
	componentWillReceiveProps() {
		const { navigator } = this.props;
		navigator.setTitle({
			title: 'Login'
		});
		navigator.setSubTitle({
			subtitle: this.props.server
		});
		navigator.setButtons({
			rightButtons: [{
				id: 'close',
				title: 'Cancel'
			}]
		});
		this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}
	onNavigatorEvent = (event) => {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'close') {
				this.props.navigator.resetTo({
					screen: 'ListServer',
					animated: false

				});
			}
		}
	}
	submit = () => {
		const {	username, password, code } = this.state;
		this.props.loginSubmit({	username, password, code });
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
			<KeyboardView style={styles.view} keyboardVerticalOffset={64}>
				<View style={styles.logoContainer}>
					<Image style={styles.logo} source={require('../images/logo.png')} />
				</View>
				<View style={styles.formContainer}>
					<TextInput
						placeholderTextColor={'rgba(255,255,255,.2)'}
						style={styles.input}
						onChangeText={username => this.setState({ username })}
						keyboardType='email-address'
						autoCorrect={false}
						returnKeyType='done'
						autoCapitalize='none'
						autoFocus

						underlineColorAndroid='transparent'
						onSubmitEditing={this.submit}
						placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email or username'}
					/>
					<TextInput
						placeholderTextColor={'rgba(255,255,255,.2)'}
						style={styles.input}
						onChangeText={password => this.setState({ password })}
						secureTextEntry
						autoCorrect={false}
						returnKeyType='done'
						autoCapitalize='none'

						underlineColorAndroid='transparent'
						onSubmitEditing={this.submit}
						placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
					/>
					{this.renderTOTP()}
					<TouchableOpacity style={styles.buttonContainer}>
						<Text style={styles.button} onPress={this.submit}>LOGIN</Text>
					</TouchableOpacity>
					{this.props.login.error && <Text style={styles.error}>{this.props.login.error}</Text>}
				</View>
				<Spinner visible={this.props.login.isFetching} textContent={'Loading...'} textStyle={{ color: '#FFF' }} />
			</KeyboardView>
		);
	}
}

function mapStateToProps(state) {
	// console.log(Object.keys(state));
	return {
		server: state.server.server,
		Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
		Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
		login: state.login
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(loginActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginView);
