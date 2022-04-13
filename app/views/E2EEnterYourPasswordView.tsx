import { StackNavigationOptions } from '@react-navigation/stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput as RNTextInput } from 'react-native';
import { connect } from 'react-redux';

import { encryptionDecodeKey } from '../actions/encryption';
import { themes } from '../lib/constants';
import Button from '../containers/Button';
import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import TextInput from '../containers/TextInput';
import { IBaseScreen } from '../definitions';
import I18n from '../i18n';
import KeyboardView from '../containers/KeyboardView';
import { E2EEnterYourPasswordStackParamList } from '../stacks/types';
import { withTheme } from '../theme';
import { events, logEvent } from '../utils/log';
import scrollPersistTaps from '../utils/scrollPersistTaps';
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

type TE2EEnterYourPasswordViewProps = IBaseScreen<E2EEnterYourPasswordStackParamList, 'E2EEnterYourPasswordView'>;

class E2EEnterYourPasswordView extends React.Component<TE2EEnterYourPasswordViewProps, IE2EEnterYourPasswordViewState> {
	private passwordInput?: RNTextInput;

	static navigationOptions = ({ navigation }: Pick<TE2EEnterYourPasswordViewProps, 'navigation'>): StackNavigationOptions => ({
		headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='e2e-enter-your-password-view-close' />,
		title: I18n.t('Enter_Your_E2E_Password')
	});

	constructor(props: TE2EEnterYourPasswordViewProps) {
		super(props);
		this.state = {
			password: ''
		};
	}

	submit = () => {
		logEvent(events.E2E_ENTER_PW_SUBMIT);
		const { password } = this.state;
		const { dispatch } = this.props;
		dispatch(encryptionDecodeKey(password));
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
							inputRef={(e: RNTextInput) => {
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

export default connect(null)(withTheme(E2EEnterYourPasswordView));
