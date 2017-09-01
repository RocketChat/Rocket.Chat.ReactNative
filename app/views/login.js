import React from 'react';

import Spinner from 'react-native-loading-spinner-overlay';

import PropTypes from 'prop-types';
import { Keyboard, Text, TextInput, StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// import * as actions from '../actions';
import * as loginActions from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';
// import { Keyboard } from 'react-native'

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		padding: 20,
		alignItems: 'stretch',
		backgroundColor: '#2f343d'
	},
	logoContainer: {
		flex: 1,
		alignItems: 'center',
		flexGrow: 1,
		justifyContent: 'center'
	},
	logo: {
		width: 150,
		// backgroundColor: 'red'
		// height: 150,
		resizeMode: 'contain'
	},
	formContainer: {
		// marginBottom: 20
	},
	input: {
		height: 40,
		marginBottom: 20,
		borderRadius: 2,
		paddingHorizontal: 10,
		borderWidth: 0,
		backgroundColor: 'rgba(255,255,255,.2)',
		color: 'white'
	},
	buttonContainer: {
		paddingVertical: 15,
		backgroundColor: '#414852',
		marginBottom: 20
	},
	button: {
		textAlign: 'center',
		color: 'white',
		borderRadius: 2,
		fontWeight: '700'
	},
	error: {
		textAlign: 'center',
		color: 'red',
		paddingTop: 5
	},
	loading: {
		flex: 1,
		position: 'absolute',
		backgroundColor: 'rgba(255,255,255,.2)',
		left: 0,
		top: 0
	}
});

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

		this.props.navigator.setTitle({
			title: 'Login'
		});
	}

	componentWillReceiveProps(nextProps) {
		this.props.navigator.setSubTitle({
			subtitle: nextProps.server
		});
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
		server: state.server,
		Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
		Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
		login: state.login
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(loginActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginView);
