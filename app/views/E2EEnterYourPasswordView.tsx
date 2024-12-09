import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useDispatch } from 'react-redux';

import { encryptionDecodeKey } from '../actions/encryption';
import Button from '../containers/Button';
import * as HeaderButton from '../containers/HeaderButton';
import KeyboardView from '../containers/KeyboardView';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { FormTextInput } from '../containers/TextInput';
import I18n from '../i18n';
import { useAppSelector, usePrevious } from '../lib/hooks';
import { events, logEvent } from '../lib/methods/helpers/log';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import { useTheme } from '../theme';
import sharedStyles from './Styles';
import { showToast } from '../lib/methods/helpers/showToast';
import { showErrorAlert, useDebounce } from '../lib/methods/helpers';

const styles = StyleSheet.create({
	info: {
		fontSize: 16,
		lineHeight: 24,
		marginTop: 24,
		...sharedStyles.textRegular
	}
});

const E2EEnterYourPasswordView = (): React.ReactElement => {
	const [password, setPassword] = useState('');
	const { colors } = useTheme();
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const dispatch = useDispatch();
	const { enabled: encryptionEnabled, failure: encryptionFailure } = useAppSelector(state => state.encryption);
	const prevEncryptionFailure = usePrevious(encryptionFailure);

	/**
	 * If e2ee is enabled, close screen and display success toast.
	 * Note: Debounce prevents `isFocused` from running another re-render and triggering another toast
	 */
	const displayEncryptionEnabled = useDebounce(
		() => {
			navigation.goBack();
			showToast(I18n.t('e2ee_enabled'));
		},
		1000,
		{ leading: true }
	);

	if (encryptionEnabled) {
		displayEncryptionEnabled();
	}

	// Wrong password
	if (encryptionFailure !== prevEncryptionFailure && encryptionFailure && password) {
		showErrorAlert(I18n.t('Encryption_error_desc'), I18n.t('Encryption_error_title'));
	}

	// If screen is closed and e2ee is still disabled, warns the user via toast
	if (!isFocused && !encryptionEnabled) {
		showToast(I18n.t('e2ee_disabled'));
	}

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<HeaderButton.CloseModal accessibilityLabel={I18n.t('Close')} testID='e2e-enter-your-password-view-close' />
			),
			title: I18n.t('Enter_E2EE_Password')
		});
	}, [navigation]);

	const submit = () => {
		logEvent(events.E2E_ENTER_PW_SUBMIT);
		dispatch(encryptionDecodeKey(password));
	};

	return (
		<KeyboardView
			style={{ backgroundColor: colors.surfaceRoom }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}>
			<StatusBar />
			<ScrollView
				{...scrollPersistTaps}
				style={sharedStyles.container}
				contentContainerStyle={{ ...sharedStyles.containerScrollView, paddingTop: 24 }}>
				<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='e2e-enter-your-password-view'>
					<FormTextInput
						label={I18n.t('Password')}
						returnKeyType='send'
						secureTextEntry
						onSubmitEditing={submit}
						onChangeText={setPassword}
						testID='e2e-enter-your-password-view-password'
						textContentType='password'
						containerStyle={{ marginBottom: 0 }}
					/>
					<Button
						onPress={submit}
						title={I18n.t('Confirm')}
						disabled={!password}
						testID='e2e-enter-your-password-view-confirm'
						style={{ marginTop: 36 }}
					/>
					<Text style={[styles.info, { color: colors.fontDefault }]}>{I18n.t('Enter_E2EE_Password_description')}</Text>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default E2EEnterYourPasswordView;
