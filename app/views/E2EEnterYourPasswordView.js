import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import { CloseModalButton } from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import I18n from '../i18n';

class E2EEnterYourPasswordView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseModalButton navigation={navigation} testID='e2e-enter-your-password-view-close' />,
		title: I18n.t('Enter_Your_E2E_Password')
	})

	static propTypes = {
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
		console.log(password);
	}

	render() {
		const { password } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID='e2e-enter-your-password-view'
				theme={theme}
			>
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
				<Text>This will allow you to access your encrypted private groups and direct messages. You need to enter the password to encode/decode messages every place you use the chat.</Text>
			</SafeAreaView>
		);
	}
}

export default withTheme(E2EEnterYourPasswordView);
