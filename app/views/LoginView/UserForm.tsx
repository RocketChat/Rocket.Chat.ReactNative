import React, { useEffect } from 'react';
import { Keyboard, Text, View, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { loginRequest } from '../../actions/login';
import Button from '../../containers/Button';
import { useWorkspaceDomain } from '../../lib/hooks/useWorkspaceDomain';
import { ControlledFormTextInput } from '../../containers/TextInput';
import I18n from '../../i18n';
import { OutsideParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import UGCRules from '../../containers/UserGeneratedContentRules';
import { useAppSelector } from '../../lib/hooks';
import styles from './styles';
import { handleLoginErrors } from './handleLoginErrors';

interface ISubmit {
	user: string;
	password: string;
}

const schema = yup.object().shape({
	user: yup.string().required(),
	password: yup.string().required()
});

const UserForm = () => {
	const { colors } = useTheme();
	const dispatch = useDispatch();
	const navigation = useNavigation<NativeStackNavigationProp<OutsideParamList, 'LoginView'>>();
	const workspaceDomain = useWorkspaceDomain();

	const {
		params: { username }
	} = useRoute<RouteProp<OutsideParamList, 'LoginView'>>();

	const {
		control,
		handleSubmit,
		formState: { isValid },
		getValues,
		setFocus
	} = useForm<ISubmit>({ mode: 'onChange', resolver: yupResolver(schema), defaultValues: { user: username || '' } });

	const {
		Accounts_EmailOrUsernamePlaceholder,
		Accounts_PasswordPlaceholder,
		Accounts_PasswordReset,
		Accounts_RegistrationForm_LinkReplacementText,
		isFetching,
		Accounts_RegistrationForm,
		inviteLinkToken,
		error,
		failure
	} = useAppSelector(state => ({
		Accounts_RegistrationForm: state.settings.Accounts_RegistrationForm as string,
		Accounts_RegistrationForm_LinkReplacementText: state.settings.Accounts_RegistrationForm_LinkReplacementText as string,
		isFetching: state.login.isFetching,
		Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder as string,
		Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder as string,
		Accounts_PasswordReset: state.settings.Accounts_PasswordReset as boolean,
		inviteLinkToken: state.inviteLinks.token,
		failure: state.login.failure,
		error: state.login.error && state.login.error.data
	}));

	useEffect(() => {
		if (failure) {
			if (error?.error === 'error-invalid-email') {
				const user = getValues('user');
				navigation.navigate('SendEmailConfirmationView', { user });
			} else {
				Alert.alert(I18n.t('Oops'), handleLoginErrors(error?.error));
			}
		}
	}, [error?.error, failure, getValues, navigation]);

	const showRegistrationButton =
		Accounts_RegistrationForm === 'Public' || (Accounts_RegistrationForm === 'Secret URL' && inviteLinkToken?.length);

	const register = () => {
		navigation.navigate('RegisterView', { title: workspaceDomain });
	};

	const forgotPassword = () => {
		navigation.navigate('ForgotPasswordView', { title: workspaceDomain });
	};

	const submit = ({ password, user }: ISubmit) => {
		if (!isValid) {
			return;
		}
		Keyboard.dismiss();
		dispatch(loginRequest({ user, password }));
	};

	return (
		<>
			<Text style={[styles.title, sharedStyles.textBold, { color: colors.fontTitlesLabels }]}>{I18n.t('Login')}</Text>
			<View style={styles.credentialsContainer}>
				<ControlledFormTextInput
					name='user'
					control={control}
					label={I18n.t('Username_or_email')}
					placeholder={Accounts_EmailOrUsernamePlaceholder}
					keyboardType='email-address'
					returnKeyType='next'
					onSubmitEditing={() => setFocus('password')}
					testID='login-view-email'
					textContentType='username'
					autoComplete='username'
				/>
				<ControlledFormTextInput
					name='password'
					control={control}
					label={I18n.t('Password')}
					placeholder={Accounts_PasswordPlaceholder}
					returnKeyType='send'
					secureTextEntry
					onSubmitEditing={handleSubmit(submit)}
					testID='login-view-password'
					textContentType='password'
					autoComplete='password'
				/>
				<Button
					title={I18n.t('Login')}
					onPress={handleSubmit(submit)}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!isValid}
				/>
			</View>
			<View style={styles.bottomContainer}>
				{Accounts_PasswordReset && (
					<View style={styles.bottomContainerGroup}>
						<Text style={[styles.bottomContainerText, { color: colors.fontSecondaryInfo }]}>{I18n.t('Forgot_password')}</Text>
						<Button
							title={I18n.t('Reset_password')}
							type='secondary'
							onPress={forgotPassword}
							testID='login-view-forgot-password'
						/>
					</View>
				)}
				{showRegistrationButton ? (
					<View style={styles.bottomContainerGroup}>
						<Text style={[styles.bottomContainerText, { color: colors.fontSecondaryInfo }]}>
							{I18n.t('You_dont_have_account')}
						</Text>
						<Button title={I18n.t('Create_account')} onPress={register} type='secondary' testID='login-view-register' />
					</View>
				) : (
					<Text style={[styles.registerDisabled, { color: colors.fontSecondaryInfo }]}>
						{Accounts_RegistrationForm_LinkReplacementText}
					</Text>
				)}
				<UGCRules />
			</View>
		</>
	);
};

export default UserForm;
