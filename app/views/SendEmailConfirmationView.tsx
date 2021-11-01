import React, { useEffect, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import { showErrorAlert } from '../utils/info';
import isValidEmail from '../utils/isValidEmail';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import { useTheme } from '../theme';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import log, { events, logEvent } from '../utils/log';
import sharedStyles from './Styles';

interface ISendEmailConfirmationView {
	navigation: StackNavigationProp<any, 'SendEmailConfirmationView'>;
	route: {
		params: {
			user?: string;
		};
	};
}

const SendEmailConfirmationView = ({ navigation, route }: ISendEmailConfirmationView): JSX.Element => {
	const [email, setEmail] = useState('');
	const [invalidEmail, setInvalidEmail] = useState(true);
	const [isFetching, setIsFetching] = useState(false);

	const { theme } = useTheme();

	const validate = (val: string) => {
		const isInvalidEmail = !isValidEmail(val);
		setEmail(val);
		setInvalidEmail(isInvalidEmail);
	};

	const resendConfirmationEmail = async () => {
		logEvent(events.SEC_SEND_EMAIL_CONFIRMATION);
		if (invalidEmail || !email) {
			return;
		}
		try {
			setIsFetching(true);
			const result = await RocketChat.sendConfirmationEmail(email);
			if (result.success) {
				navigation.pop();
				showErrorAlert(I18n.t('Verify_email_desc'));
			}
		} catch (e: any) {
			log(e);
			const msg = e?.data?.error || I18n.t('There_was_an_error_while_action', { action: I18n.t('sending_email_confirmation') });
			showErrorAlert(msg, I18n.t('Alert'));
		}
		setIsFetching(false);
	};

	useEffect(() => {
		navigation.setOptions({
			title: 'Rocket.Chat'
		});
		if (route.params?.user) {
			validate(route.params.user);
		}
	}, []);

	return (
		<FormContainer theme={theme} testID='send-email-confirmation-view'>
			<FormContainerInner>
				<TextInput
					autoFocus
					placeholder={I18n.t('Email')}
					keyboardType='email-address'
					returnKeyType='send'
					onChangeText={(email: string) => validate(email)}
					onSubmitEditing={resendConfirmationEmail}
					testID='send-email-confirmation-view-email'
					containerStyle={sharedStyles.inputLastChild}
					theme={theme}
					value={email}
				/>
				<Button
					title={I18n.t('Send_email_confirmation')}
					type='primary'
					onPress={resendConfirmationEmail}
					testID='send-email-confirmation-view-submit'
					loading={isFetching}
					disabled={invalidEmail}
					theme={theme}
				/>
			</FormContainerInner>
		</FormContainer>
	);
};
export default SendEmailConfirmationView;
