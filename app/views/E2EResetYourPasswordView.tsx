import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type E2EEnterYourPasswordStackParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { e2eResetOwnKey } from '../lib/services/restApi';
import { showConfirmationAlert, showErrorAlert } from '../lib/methods/helpers';
import { logout } from '../actions/login';
import log, { events, logEvent } from '../lib/methods/helpers/log';
import Button from '../containers/Button';
import * as HeaderButton from '../containers/Header/components/HeaderButton';
import KeyboardView from '../containers/KeyboardView';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import sharedStyles from './Styles';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';

const styles = StyleSheet.create({
	info: {
		fontSize: 16,
		lineHeight: 24,
		marginTop: 24,
		...sharedStyles.textRegular
	},
	content: {
		gap: 32
	}
});

interface IE2EResetYourPasswordView {
	navigation: NativeStackNavigationProp<E2EEnterYourPasswordStackParamList, 'E2EResetYourPasswordView'>;
}

const E2EResetYourPasswordView = ({ navigation }: IE2EResetYourPasswordView): React.ReactElement => {
	const { colors } = useTheme();
	const dispatch = useDispatch();

	const resetE2EEPassword = () => {
		showConfirmationAlert({
			title: I18n.t('Are_you_sure_question_mark'),
			message: I18n.t('E2E_encryption_reset_message'),
			confirmationText: I18n.t('E2E_encryption_reset_confirmation'),
			onPress: async () => {
				logEvent(events.E2E_SEC_RESET_OWN_KEY);
				try {
					const res = await e2eResetOwnKey();

					if (res?.success === true) {
						dispatch(logout());
					}
				} catch (e) {
					log(e);
					showErrorAlert(I18n.t('E2E_encryption_reset_error'));
				}
			}
		});
	};

	const cancel = () => {
		navigation.getParent()?.goBack();
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => <HeaderButton.CloseModal testID='e2e-reset-your-password-view-close' />,
			title: I18n.t('Reset_E2EE_Password')
		});
	}, [navigation]);

	return (
		<KeyboardView>
			<ScrollView
				{...scrollPersistTaps}
				style={sharedStyles.container}
				contentContainerStyle={{ ...sharedStyles.containerScrollView }}>
				<SafeAreaView style={{ ...styles.content, backgroundColor: colors.surfaceRoom }} testID='e2e-reset-your-password-view'>
					<Text style={[styles.info, { color: colors.fontDefault }]}>{I18n.t('Enter_E2EE_Password_description')}</Text>

					<View>
						<Button
							onPress={resetE2EEPassword}
							title={I18n.t('Reset_E2EE_Password')}
							testID='e2e-reset-your-password-view-reset-password'
						/>
						<Button type='secondary' onPress={cancel} title={I18n.t('Cancel')} testID='e2e-reset-your-password-view-cancel' />
					</View>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default E2EResetYourPasswordView;
