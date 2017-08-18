import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextInput, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
// import * as actions from '../actions';
import * as loginActions from '../actions/login';
import KeyboardView from '../components/KeyboardView';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'stretch',
		backgroundColor: '#fff'
	},
	input: {
		height: 40,
		borderColor: '#aaa',
		marginLeft: 20,
		marginRight: 20,
		marginTop: 10,
		padding: 5,
		borderWidth: 0,
		backgroundColor: '#f6f6f6'
	},
	error: {
		textAlign: 'center',
		color: 'red',
		paddingTop: 5
	}
});

class LoginView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		loginRequest: PropTypes.func.isRequired,
		server: PropTypes.string.isRequired,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string
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
		console.log({	username, password, code });
		this.props.loginRequest({	username, password, code });
		this.props.navigator.dismissModal();
	}

	renderTOTP = () => {
		if (this.state.totp) {
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
				<TextInput
					style={styles.input}
					onChangeText={username => this.setState({ username })}
					keyboardType='email-address'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					autoFocus
					onSubmitEditing={this.submit}
					placeholder={this.props.Accounts_EmailOrUsernamePlaceholder || 'Email or username'}
				/>
				<TextInput
					style={styles.input}
					onChangeText={password => this.setState({ password })}
					secureTextEntry
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					onSubmitEditing={this.submit}
					placeholder={this.props.Accounts_PasswordPlaceholder || 'Password'}
				/>
				{this.renderTOTP()}
				<Text style={styles.error}>{this.state.error}</Text>
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
