import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import PropTypes from 'prop-types';
import { Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as loginActions from '../actions/login';
import KeyboardView from '../presentation/KeyboardView';

import styles from './Styles';

class LoginView extends React.Component {
	static propTypes = {
		forgotPasswordInit: PropTypes.func.isRequired,
		forgotPasswordRequest: PropTypes.func.isRequired,
		login: PropTypes.object,
		navigation: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);

		this.state = {
			email: ''
		};
	}

	componentWillMount() {
		this.props.forgotPasswordInit();
	}

	componentDidUpdate() {
		const { login } = this.props;
		if (login.success) {
			this.props.navigation.goBack();
			setTimeout(() => {
				Alert.alert(
					'Alert',
					'If this email is registered, ' +
					'we\'ll send instructions on how to reset your password. ' +
					'If you do not receive an email shortly, please come back and try again.'
				);
			});
		}
	}

	resetPassword = () => {
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
				<View style={styles.loginView}>
					<View style={styles.formContainer}>
						<TextInput
							style={styles.input_white}
							onChangeText={email => this.setState({ email })}
							keyboardType='email-address'
							autoCorrect={false}
							returnKeyType='next'
							autoCapitalize='none'
							underlineColorAndroid='transparent'
							onSubmitEditing={() => this.resetPassword()}
							placeholder='Email'
						/>

						<TouchableOpacity style={styles.buttonContainer} onPress={this.resetPassword}>
							<Text style={styles.button}>RESET PASSWORD</Text>
						</TouchableOpacity>

						<TouchableOpacity style={styles.buttonContainer} onPress={this.backLogin}>
							<Text style={styles.button}>BACK TO LOGIN</Text>
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
	return {
		login: state.login
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(loginActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginView);
