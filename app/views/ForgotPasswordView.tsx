import React, { useLayoutEffect, useState } from 'react';
import { Text } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '../containers/Button';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import { FormTextInput } from '../containers/TextInput';
import I18n from '../i18n';
import { themes } from '../lib/constants';
import { Services } from '../lib/services';
import { OutsideParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { showErrorAlert } from '../lib/methods/helpers';
import { events, logEvent } from '../lib/methods/helpers/log';
import sharedStyles from './Styles';

const schema = yup.object().shape({
	email: yup.string().email('EMAIL INVALIDO').required('NECESSITA DE UM EMAIL')
});

interface ISubmit {
	email: string;
}

const ForgotPasswordView = () => {
	const { control, handleSubmit } = useForm<ISubmit>({ resolver: yupResolver(schema) });

	const [isValid, setIsValid] = useState(false);
	const [isFetching, setIsFetching] = useState(false);

	const navigation = useNavigation<StackNavigationProp<OutsideParamList, 'ForgotPasswordView'>>();
	const { params } = useRoute<RouteProp<OutsideParamList, 'ForgotPasswordView'>>();
	const { theme } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: params?.title ?? 'Rocket.Chat'
		});
	}, [navigation, params?.title]);

	const validateEmail = (email: string) => {
		const valid = schema.isValidSync({ email });
		setIsValid(valid);
	};

	const resetPassword = async ({ email }: ISubmit) => {
		if (!isValid) {
			return;
		}
		try {
			logEvent(events.FP_FORGOT_PASSWORD);
			setIsFetching(true);
			const result = await Services.forgotPassword(email);
			if (result.success) {
				navigation.pop();
				showErrorAlert(I18n.t('Forgot_password_If_this_email_is_registered'), I18n.t('Alert'));
			}
		} catch (e: any) {
			logEvent(events.FP_FORGOT_PASSWORD_F);
			const msg = (e.data && e.data.error) || I18n.t('There_was_an_error_while_action', { action: I18n.t('resetting_password') });
			showErrorAlert(msg, I18n.t('Alert'));
		}
		setIsFetching(false);
	};

	return (
		<FormContainer testID='forgot-password-view'>
			<FormContainerInner>
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>
					{I18n.t('Forgot_password')}
				</Text>
				<Controller
					name='email'
					control={control}
					render={({ field: { onChange, value } }) => (
						<FormTextInput
							onChangeText={text => {
								onChange(text);
								validateEmail(text);
							}}
							value={value}
							autoFocus
							placeholder={I18n.t('Email')}
							keyboardType='email-address'
							returnKeyType='send'
							iconLeft='mail'
							onSubmitEditing={handleSubmit(resetPassword)}
							testID='forgot-password-view-email'
							containerStyle={sharedStyles.inputLastChild}
						/>
					)}
				/>
				<Button
					title={I18n.t('Reset_password')}
					type='primary'
					onPress={handleSubmit(resetPassword)}
					testID='forgot-password-view-submit'
					loading={isFetching}
					disabled={!isValid}
				/>
			</FormContainerInner>
		</FormContainer>
	);
};

export default ForgotPasswordView;
