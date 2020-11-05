import React from 'react';
import PropTypes from 'prop-types';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { connect } from 'react-redux';

import I18n from '../i18n';
import sharedStyles from './Styles';
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
import { logEvent, events } from '../utils/log';

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
class E2EEnterYourPasswordView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <HeaderButton.CloseModal navigation={navigation} testID='e2e-enter-your-password-view-close' />,
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
		logEvent(events.E2E_ENTER_PW_SUBMIT);
		const { password } = this.state;
		const { encryptionDecodeKey } = this.props;
		encryptionDecodeKey(password);
	}

	render() {
		const { password } = this.state;
		const { theme } = this.props;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} style={sharedStyles.container} contentContainerStyle={[sharedStyles.containerScrollView, styles.scrollView]}>
					<SafeAreaView style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]} testID='e2e-enter-your-password-view'>
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

const mapDispatchToProps = dispatch => ({
	encryptionDecodeKey: password => dispatch(encryptionDecodeKeyAction(password))
});
export default connect(null, mapDispatchToProps)(withTheme(E2EEnterYourPasswordView));
