import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';

import I18n from '../i18n';
import { withTheme } from '../theme';
import Button from '../containers/Button';
import { themes } from '../constants/colors';
import TextInput from '../containers/TextInput';
import SafeAreaView from '../containers/SafeAreaView';
import * as HeaderButton from '../containers/HeaderButton';
import { encryptionDecodeKey as encryptionDecodeKeyAction } from '../actions/encryption';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import KeyboardView from '../presentation/KeyboardView';
import StatusBar from '../containers/StatusBar';
import { events, logEvent } from '../utils/log';
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	container: {
		padding: 28
	},
	info: {
		fontSize: 14,
		marginVertical: 8,
		...sharedStyles.textRegular
	}
});

interface IE2EEnterYourPasswordViewState {
	password: string;
}

interface IE2EEnterYourPasswordViewProps {
	encryptionDecodeKey: (password: string) => void;
	theme: string;
	navigation: StackNavigationProp<any, 'E2EEnterYourPasswordView'>;
}

class E2EEnterYourPasswordView extends React.Component<IE2EEnterYourPasswordViewProps, IE2EEnterYourPasswordViewState> {
	private passwordInput?: TextInput;

	static navigationOptions = ({ navigation }: Pick<IE2EEnterYourPasswordViewProps, 'navigation'>): StackNavigationOptions => ({
		headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='e2e-enter-your-password-view-close' />,
		title: I18n.t('Enter_Your_E2E_Password')
	});

	constructor(props: IE2EEnterYourPasswordViewProps) {
		super(props);
		this.state = {
			password: ''
		};
	}

	submit = () => {
		logEvent(events.E2E_ENTER_PW_SUBMIT);
		const { password } = this.state;
		const { encryptionDecodeKey } = this.props;
		encryptionDecodeKey(password);
	};

	render() {
		const { password } = this.state;
		const { theme } = this.props;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					style={sharedStyles.container}
					contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView
						style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}
						testID='e2e-enter-your-password-view'>
						<TextInput
							inputRef={(e: TextInput) => {
								this.passwordInput = e;
							}}
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
							testID='e2e-enter-your-password-view-confirm'
						/>
						<Text style={[styles.info, { color: themes[theme].bodyText }]}>{I18n.t('Enter_Your_Encryption_Password_desc1')}</Text>
						<Text style={[styles.info, { color: themes[theme].bodyText }]}>{I18n.t('Enter_Your_Encryption_Password_desc2')}</Text>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
	encryptionDecodeKey: (password: string) => dispatch(encryptionDecodeKeyAction(password))
});
export default connect(null, mapDispatchToProps)(withTheme(E2EEnterYourPasswordView));
