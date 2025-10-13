import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, AccessibilityInfo } from 'react-native';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';

import { encryptionDecodeKey } from '../actions/encryption';
import Button from '../containers/Button';
import * as HeaderButton from '../containers/Header/components/HeaderButton';
import KeyboardView from '../containers/KeyboardView';
import SafeAreaView from '../containers/SafeAreaView';
import { ControlledFormTextInput } from '../containers/TextInput';
import I18n from '../i18n';
import { useAppSelector } from '../lib/hooks/useAppSelector';
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
	const { colors } = useTheme();
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const dispatch = useDispatch();
	const { enabled: encryptionEnabled, failure: encryptionFailure } = useAppSelector(state => state.encryption);
	const prevEncryptionFailure = useRef<boolean>(encryptionFailure);
	const {
		control,
		setError,
		watch,
		handleSubmit,
		formState: { errors }
	} = useForm({
		mode: 'onChange',
		defaultValues: { password: '' }
	});

	const password = watch('password');

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

	// If screen is closed and e2ee is still disabled, warns the user via toast
	if (!isFocused && !encryptionEnabled) {
		showToast(I18n.t('e2ee_disabled'));
	}

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HeaderButton.CloseModal testID='e2e-enter-your-password-view-close' />,
			title: I18n.t('Enter_E2EE_Password')
		});
	}, [navigation]);

	useEffect(() => {
		if (encryptionFailure !== prevEncryptionFailure.current && encryptionFailure && password) {
			setError('password', { message: I18n.t('Error_incorrect_password'), type: 'validate' });
			showErrorAlert(I18n.t('Encryption_error_desc'), I18n.t('Encryption_error_title'));
			AccessibilityInfo.announceForAccessibility(I18n.t('Invalid_URL'));
			prevEncryptionFailure.current = encryptionFailure;
		}
	}, [encryptionFailure, prevEncryptionFailure]);

	const submit = () => {
		prevEncryptionFailure.current = false;
		logEvent(events.E2E_ENTER_PW_SUBMIT);
		dispatch(encryptionDecodeKey(password));
	};

	return (
		<KeyboardView>
			<ScrollView
				{...scrollPersistTaps}
				style={sharedStyles.container}
				contentContainerStyle={{ ...sharedStyles.containerScrollView, paddingTop: 24 }}>
				<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='e2e-enter-your-password-view'>
					<ControlledFormTextInput
						name='password'
						control={control}
						label={I18n.t('Password')}
						error={errors.password?.message}
						returnKeyType='send'
						secureTextEntry
						onSubmitEditing={submit}
						testID='e2e-enter-your-password-view-password'
						autoComplete='password'
						textContentType='password'
						importantForAutofill='yes'
						containerStyle={{ marginBottom: 0 }}
					/>
					<Button
						onPress={handleSubmit(submit)}
						title={I18n.t('Confirm')}
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
