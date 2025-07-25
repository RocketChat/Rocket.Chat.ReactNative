import React, { useLayoutEffect, useState } from 'react';
import { Text } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '../containers/Button';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import { ControlledFormTextInput } from '../containers/TextInput';
import I18n from '../i18n';
import { Services } from '../lib/services';
import { OutsideParamList } from '../stacks/types';
import { useTheme } from '../theme';
import { showErrorAlert } from '../lib/methods/helpers';
import { events, logEvent } from '../lib/methods/helpers/log';
import sharedStyles from './Styles';

const schema = yup.object().shape({
	email: yup.string().email().required()
});

interface ISubmit {
	email: string;
}

const ForgotPasswordView = (): React.ReactElement => {
	const {
		control,
		handleSubmit,
		formState: { isValid }
	} = useForm<ISubmit>({ mode: 'onChange', resolver: yupResolver(schema) });

	const [isFetching, setIsFetching] = useState(false);

	const navigation = useNavigation<NativeStackNavigationProp<OutsideParamList, 'ForgotPasswordView'>>();
	const { params } = useRoute<RouteProp<OutsideParamList, 'ForgotPasswordView'>>();
	const { colors } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: params?.title ?? 'Rocket.Chat'
		});
	}, [navigation, params?.title]);

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
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: colors.fontTitlesLabels, fontSize: 24 }]}>
					{I18n.t('Reset_password')}
				</Text>
				<Text style={[sharedStyles.textMedium, { color: colors.fontTitlesLabels, lineHeight: 22, fontSize: 16 }]}>
					{I18n.t('email')}
				</Text>
				<ControlledFormTextInput
					name='email'
					control={control}
					autoFocus
					keyboardType='email-address'
					returnKeyType='send'
					onSubmitEditing={handleSubmit(resetPassword)}
					testID='forgot-password-view-email'
					containerStyle={{ marginBottom: 20 }}
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
