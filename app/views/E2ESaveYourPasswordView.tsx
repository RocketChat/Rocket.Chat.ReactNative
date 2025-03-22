import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { encryptionSetBanner } from '../actions/encryption';
import Button from '../containers/Button';
import * as HeaderButton from '../containers/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { LISTENER } from '../containers/Toast';
import I18n from '../i18n';
import { E2E_RANDOM_PASSWORD_KEY } from '../lib/constants';
import { useAppSelector } from '../lib/hooks';
import EventEmitter from '../lib/methods/helpers/events';
import { events, logEvent } from '../lib/methods/helpers/log';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import UserPreferences from '../lib/methods/userPreferences';
import { E2ESaveYourPasswordStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import sharedStyles from './Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 32
	},
	content: {
		marginVertical: 68,
		alignItems: 'center'
	},
	warning: {
		fontSize: 16,
		...sharedStyles.textMedium,
		textAlign: 'center'
	},
	passwordText: {
		fontSize: 14,
		marginBottom: 8,
		...sharedStyles.textAlignCenter
	},
	password: {
		fontSize: 24,
		marginBottom: 24,
		...sharedStyles.textBold
	},
	copyButton: {
		width: 72,
		height: 32
	},
	info: {
		fontSize: 16,
		marginBottom: 64,
		...sharedStyles.textRegular,
		textAlign: 'center'
	}
});

const E2ESaveYourPasswordView = () => {
	const server = useAppSelector(state => state.server.server);
	const navigation = useNavigation<NativeStackNavigationProp<E2ESaveYourPasswordStackParamList, 'E2ESaveYourPasswordView'>>();
	const dispatch = useDispatch();
	const [password, setPassword] = useState('');
	const { colors } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Save_Your_E2E_Password'),
			headerLeft: () => <HeaderButton.CloseModal testID='e2e-save-your-password-view-close' />
		});
	}, [navigation]);

	useEffect(() => {
		const init = () => {
			const password = UserPreferences.getString(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);
			if (password) setPassword(password);
		};
		init();
	}, []);

	const onSaved = () => {
		logEvent(events.E2E_SAVE_PW_SAVED);
		UserPreferences.removeItem(`${server}-${E2E_RANDOM_PASSWORD_KEY}`);
		dispatch(encryptionSetBanner());
		navigation.dispatch(StackActions.pop());
	};

	const onCopy = () => {
		logEvent(events.E2E_SAVE_PW_COPY);
		if (password) {
			Clipboard.setString(password);
			EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
		}
	};

	const onHowItWorks = () => {
		logEvent(events.E2E_SAVE_PW_HOW_IT_WORKS);
		navigation.navigate('E2EHowItWorksView');
	};

	return (
		<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='e2e-save-password-view'>
			<StatusBar />
			<ScrollView {...scrollPersistTaps} style={sharedStyles.container} contentContainerStyle={sharedStyles.containerScrollView}>
				<View style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
					<Text style={[styles.warning, { color: colors.fontDanger }]}>{I18n.t('Save_Your_Encryption_Password_warning')}</Text>
					<View style={styles.content}>
						<Text style={[styles.passwordText, { color: colors.fontDefault }]}>{I18n.t('Your_password_is')}</Text>
						<Text style={[styles.password, { color: colors.fontDefault }]}>{password}</Text>
						<Button
							onPress={onCopy}
							style={[styles.copyButton, { backgroundColor: colors.surfaceHover }]}
							title={I18n.t('Copy')}
							type='secondary'
							fontSize={14}
						/>
					</View>
					<Text style={[styles.info, { color: colors.fontDefault }]}>{I18n.t('Save_Your_Encryption_Password_info')}</Text>
					<Button
						onPress={onHowItWorks}
						style={{ backgroundColor: colors.surfaceHover }}
						title={I18n.t('How_It_Works')}
						type='secondary'
						testID='e2e-save-password-view-how-it-works'
					/>
					<Button onPress={onSaved} title={I18n.t('I_Saved_My_E2E_Password')} testID='e2e-save-password-view-saved-password' />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default E2ESaveYourPasswordView;
