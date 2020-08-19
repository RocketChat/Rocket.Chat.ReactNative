import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import I18n from '../i18n';
import { withTheme } from '../theme';
import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import { CloseModalButton } from '../containers/HeaderButton';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import { encryptionDecodeKey as encryptionDecodeKeyAction } from '../actions/encryption';

class E2EEnterYourPasswordView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseModalButton navigation={navigation} testID='e2e-enter-your-password-view-close' />,
		title: I18n.t('Enter_Your_E2E_Password')
	})

	static propTypes = {
		encryptionDecodeKey: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			password: ''
		};
	}

	submit = () => {
		const { password } = this.state;
		const { encryptionDecodeKey } = this.props;
		encryptionDecodeKey(password);
	}

	render() {
		const { password } = this.state;
		const { theme } = this.props;
		return (
			<FormContainer theme={theme} testID='register-view'>
				<FormContainerInner>
					<TextInput
						inputRef={(e) => { this.passwordInput = e; }}
						placeholder={I18n.t('Password')}
						returnKeyType='send'
						secureTextEntry
						onSubmitEditing={this.submit}
						onChangeText={value => this.setState({ password: value })}
						testID='e2e-enter-your-password-view-password'
						textContentType='password'
						autoCompleteType='password'
						theme={theme}
					/>
					<Button
						onPress={this.submit}
						title={I18n.t('Confirm')}
						disabled={!password}
						theme={theme}
					/>
					<Text>This will allow you to access your encrypted private groups and direct messages.</Text>
					<Text>You need to enter the password to encode/decode messages every place you use the chat.</Text>
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapDispatchToProps = dispatch => ({
	encryptionDecodeKey: password => dispatch(encryptionDecodeKeyAction(password))
});
export default connect(null, mapDispatchToProps)(withTheme(E2EEnterYourPasswordView));
