import { useNavigation } from '@react-navigation/native';
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
import { events, logEvent } from '../lib/methods/helpers/log';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import { useTheme } from '../theme';
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	info: {
		fontSize: 16,
		marginVertical: 4,
		...sharedStyles.textRegular
	}
});

const E2EEnterYourPasswordView = (): React.ReactElement => {
	const [password, setPassword] = useState('');
	const { colors } = useTheme();
	const navigation = useNavigation();
	const dispatch = useDispatch();

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HeaderButton.CloseModal testID='e2e-enter-your-password-view-close' />,
			title: I18n.t('Enter_Your_E2E_Password')
		});
	}, [navigation]);

	const submit = () => {
		logEvent(events.E2E_ENTER_PW_SUBMIT);
		dispatch(encryptionDecodeKey(password));
	};

	return (
		<KeyboardView
			style={{ backgroundColor: colors.backgroundColor }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<ScrollView {...scrollPersistTaps} style={sharedStyles.container} contentContainerStyle={sharedStyles.containerScrollView}>
				<SafeAreaView style={{ backgroundColor: colors.backgroundColor }} testID='e2e-enter-your-password-view'>
					<FormTextInput
						placeholder={I18n.t('Password')}
						returnKeyType='send'
						secureTextEntry
						onSubmitEditing={submit}
						onChangeText={setPassword}
						testID='e2e-enter-your-password-view-password'
						textContentType='password'
					/>
					<Button onPress={submit} title={I18n.t('Confirm')} disabled={!password} testID='e2e-enter-your-password-view-confirm' />
					<Text style={[styles.info, { color: colors.bodyText }]}>{I18n.t('Enter_Your_Encryption_Password_desc1')}</Text>
					<Text style={[styles.info, { color: colors.bodyText }]}>{I18n.t('Enter_Your_Encryption_Password_desc2')}</Text>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default E2EEnterYourPasswordView;
