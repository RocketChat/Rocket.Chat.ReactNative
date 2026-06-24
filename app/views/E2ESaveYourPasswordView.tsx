import Clipboard from '@react-native-clipboard/clipboard';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { StackActions, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native-unistyles';

import { encryptionSetBanner } from '../actions/encryption';
import Button from '../containers/Button';
import * as HeaderButton from '../containers/Header/components/HeaderButton';
import SafeAreaView from '../containers/SafeAreaView';
import { LISTENER } from '../containers/Toast';
import I18n from '../i18n';
import { E2E_RANDOM_PASSWORD_KEY } from '../lib/constants/keys';
import { useAppSelector } from '../lib/hooks/useAppSelector';
import EventEmitter from '../lib/methods/helpers/events';
import { events, logEvent } from '../lib/methods/helpers/log';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import UserPreferences from '../lib/methods/userPreferences';
import { type E2ESaveYourPasswordStackParamList } from '../stacks/types';
import sharedStyles from './Styles';

const styles = StyleSheet.create(theme => ({
	safeArea: {
		backgroundColor: theme.colors.surfaceRoom
	},
	container: {
		flex: 1,
		backgroundColor: theme.colors.surfaceRoom
	},
	content: {
		alignItems: 'center',
		gap: 20
	},
	warning: {
		marginTop: 24,
		fontSize: 16,
		...sharedStyles.textMedium,
		textAlign: 'center',
		color: theme.colors.fontDanger
	},
	passwordText: {
		fontSize: 16,
		...sharedStyles.textAlignCenter,
		color: theme.colors.fontDefault
	},
	password: {
		fontSize: 24,
		...sharedStyles.textMedium,
		fontFamily: 'monospace',
		textAlign: 'justify',
		borderRadius: 4,
		padding: 12,
		color: theme.colors.fontDefault,
		backgroundColor: theme.colors.surfaceHover
	},
	copyButton: {
		paddingHorizontal: 20,
		paddingVertical: 8,
		backgroundColor: theme.colors.surfaceHover
	},
	info: {
		fontSize: 16,
		...sharedStyles.textMedium,
		textAlign: 'center',
		color: theme.colors.fontDefault
	},
	howItWorksButton: {
		backgroundColor: theme.colors.surfaceHover,
		marginBottom: 0
	}
}));

const E2ESaveYourPasswordView = () => {
	const server = useAppSelector(state => state.server.server);
	const navigation = useNavigation<NativeStackNavigationProp<E2ESaveYourPasswordStackParamList, 'E2ESaveYourPasswordView'>>();
	const dispatch = useDispatch();
	const [password, setPassword] = useState('');

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
		<SafeAreaView style={styles.safeArea} testID='e2e-save-password-view'>
			<ScrollView
				{...scrollPersistTaps}
				style={sharedStyles.container}
				contentContainerStyle={[sharedStyles.containerScrollView, { flexGrow: 1 }]}>
				<View style={styles.container}>
					<View style={{ flex: 1, gap: 64 }}>
						<Text style={styles.warning}>{I18n.t('Save_Your_Encryption_Password_warning')}</Text>
						<View style={styles.content}>
							<Text style={styles.passwordText}>{I18n.t('Your_password_is')}</Text>
							<Text style={styles.password}>{password}</Text>
							<Button onPress={onCopy} style={styles.copyButton} title={I18n.t('Copy')} type='secondary' fontSize={14} />
						</View>
						<Text style={styles.info}>{I18n.t('Save_Your_Encryption_Password_info')}</Text>
					</View>
					<View style={{ gap: 8, flex: 1, justifyContent: 'flex-end' }}>
						<Button
							onPress={onHowItWorks}
							style={styles.howItWorksButton}
							title={I18n.t('How_It_Works')}
							type='secondary'
							testID='e2e-save-password-view-how-it-works'
						/>
						<Button
							onPress={onSaved}
							style={{ marginBottom: 0 }}
							title={I18n.t('I_Saved_My_E2E_Password')}
							testID='e2e-save-password-view-saved-password'
						/>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default E2ESaveYourPasswordView;
