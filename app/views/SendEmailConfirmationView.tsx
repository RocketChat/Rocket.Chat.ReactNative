import React from 'react';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import { showErrorAlert } from '../utils/info';
import isValidEmail from '../utils/isValidEmail';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import { withTheme } from '../theme';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import log, { events, logEvent } from '../utils/log';
import sharedStyles from './Styles';

interface IState {
	email: string;
	invalidEmail: boolean;
	isFetching: boolean;
}

interface ISendEmailConfirmationView {
	navigation: StackNavigationProp<any, 'SendEmailConfirmationView'>;
	theme: string;
	route: {
		params: {
			user?: string;
		};
	};
}

class SendEmailConfirmationView extends React.Component<ISendEmailConfirmationView, IState> {
	static navigationOptions: StackNavigationOptions = {
		title: 'Rocket.Chat'
	};

	state = {
		email: '',
		invalidEmail: true,
		isFetching: false
	};

	componentDidMount() {
		const { route } = this.props;
		if (route.params?.user) {
			this.validate(route.params.user);
		}
	}

	shouldComponentUpdate(nextProps: ISendEmailConfirmationView, nextState: IState) {
		const { email, invalidEmail, isFetching } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.email !== email) {
			return true;
		}
		if (nextState.invalidEmail !== invalidEmail) {
			return true;
		}
		if (nextState.isFetching !== isFetching) {
			return true;
		}
		return false;
	}

	validate = (email: string) => {
		const invalidEmail = !isValidEmail(email);
		this.setState({ email, invalidEmail });
	};

	resendConfirmationEmail = async () => {
		logEvent(events.SEC_SEND_EMAIL_CONFIRMATION);
		const { email, invalidEmail } = this.state;
		if (invalidEmail || !email) {
			return;
		}
		try {
			this.setState({ isFetching: true });
			const result = await RocketChat.sendConfirmationEmail(email);
			if (result.success) {
				const { navigation } = this.props;
				navigation.pop();
				showErrorAlert(I18n.t('Verify_email_desc'));
			}
		} catch (e: any) {
			log(e);
			const msg =
				(e.data && e.data.error) || I18n.t('There_was_an_error_while_action', { action: I18n.t('sending_email_confirmation') });
			showErrorAlert(msg, I18n.t('Alert'));
		}
		this.setState({ isFetching: false });
	};

	render() {
		const { email, invalidEmail, isFetching } = this.state;
		const { theme } = this.props;

		return (
			<FormContainer theme={theme} testID='send-email-confirmation-view'>
				<FormContainerInner>
					<TextInput
						autoFocus
						placeholder={I18n.t('Email')}
						keyboardType='email-address'
						returnKeyType='send'
						onChangeText={(email: string) => this.validate(email)}
						onSubmitEditing={this.resendConfirmationEmail}
						testID='send-email-confirmation-view-email'
						containerStyle={sharedStyles.inputLastChild}
						theme={theme}
						value={email}
					/>
					<Button
						title={I18n.t('Send_email_confirmation')}
						type='primary'
						onPress={this.resendConfirmationEmail}
						testID='send-email-confirmation-view-submit'
						loading={isFetching}
						disabled={invalidEmail}
						theme={theme}
					/>
				</FormContainerInner>
			</FormContainer>
		);
	}
}

export default withTheme(SendEmailConfirmationView);
