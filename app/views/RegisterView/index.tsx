import React, { useLayoutEffect, useRef, useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';
import parse from 'url-parse';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { loginRequest } from '../../actions/login';
import Button from '../../containers/Button';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import LoginServices from '../../containers/LoginServices';
import { FormTextInput } from '../../containers/TextInput';
import { IBaseScreen } from '../../definitions';
import I18n from '../../i18n';
import { getShowLoginButton } from '../../selectors/login';
import { OutsideParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import { showErrorAlert, isValidEmail } from '../../lib/methods/helpers';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { Services } from '../../lib/services';
import UGCRules from '../../containers/UserGeneratedContentRules';
import { useAppSelector } from '../../lib/hooks';
import PasswordPolicies from '../../containers/PasswordPolicies';
import getCustomFields from '../../lib/methods/getCustomFields';
import useVerifyPassword from '../../lib/hooks/useVerifyPassword';
import CustomFields from '../../containers/CustomFields';
import useParsedCustomFields from '../../lib/hooks/useParsedCustomFields';
import styles from './styles';

const validationSchema = yup.object().shape({
	name: yup.string().min(1).required(),
	email: yup.string().email().required(),
	username: yup.string().min(1).required()
});

interface IProps extends IBaseScreen<OutsideParamList, 'RegisterView'> {}

const RegisterView = ({ navigation, route }: IProps) => {
	const dispatch = useDispatch();
	const { colors } = useTheme();
	const { Accounts_CustomFields, Site_Url, Accounts_EmailVerification, Accounts_ManuallyApproveNewUsers, showLoginButton } =
		useAppSelector(state => ({
			...state.settings,
			showLoginButton: getShowLoginButton(state),
			Site_Url: state.settings.Site_Url as string,
			Accounts_CustomFields: state.settings.Accounts_CustomFields as string
		}));
	const {
		control,
		handleSubmit,
		setFocus,
		getValues,
		watch,
		formState: { isValid, dirtyFields }
	} = useForm({
		mode: 'onChange',
		defaultValues: {
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
			username: ''
		},
		resolver: yupResolver(validationSchema)
	});
	const password = watch('password');
	const confirmPassword = watch('confirmPassword');
	const { parsedCustomFields } = useParsedCustomFields(Accounts_CustomFields);
	const [customFields, setCustomFields] = useState(getCustomFields(parsedCustomFields));
	const [saving, setSaving] = useState(false);
	const { passwordPolicies, isPasswordValid } = useVerifyPassword(password, confirmPassword);
	const customFieldsRef = useRef<{ [key: string]: TextInput | undefined }>({});

	const focusOnCustomFields = () => {
		if (!parsedCustomFields) return;
		const [firstCustomFieldKey] = Object.keys(parsedCustomFields);

		customFieldsRef.current[firstCustomFieldKey]?.focus();
	};

	const login = () => {
		navigation.navigate('LoginView', { title: new parse(Site_Url).hostname });
	};

	const validateDefaultFormInfo = () => {
		const isValid = validationSchema.isValidSync(getValues());
		if (!parsedCustomFields) {
			return isValid;
		}
		let requiredCheck = true;
		let minLengthCheck = true;
		Object.keys(parsedCustomFields).forEach((key: string) => {
			if (parsedCustomFields[key].required) {
				requiredCheck = requiredCheck && customFields[key] && Boolean(customFields[key].trim());
			}
			const { minLength } = parsedCustomFields[key];
			if (minLength !== undefined && customFields[key]) {
				minLengthCheck = customFields[key]?.length > minLength;
			}
		});
		return isValid && minLengthCheck && requiredCheck;
	};

	const onSubmit = async (data: any) => {
		logEvent(events.REGISTER_DEFAULT_SIGN_UP);

		const { name, email, password, username } = data;

		if (!validateDefaultFormInfo()) {
			return;
		}

		if (!isValidEmail(email)) {
			showErrorAlert(I18n.t('Invalid_email'), I18n.t('Error'));
			return;
		}

		setSaving(true);
		Keyboard.dismiss();

		try {
			const response = await Services.register({ name, email, pass: password, username });

			if (response.success) {
				if (Accounts_EmailVerification) {
					showErrorAlert(I18n.t('Verify_email_desc'), I18n.t('Registration_Succeeded'));
					navigation.goBack();
				} else if (Accounts_ManuallyApproveNewUsers) {
					showErrorAlert(I18n.t('Wait_activation_warning'), I18n.t('Registration_Succeeded'));
					navigation.goBack();
				} else {
					dispatch(loginRequest({ user: email, password }, false, false, customFields));
				}
			}
		} catch (error: any) {
			if (error.data?.errorType === 'username-invalid') {
				return dispatch(loginRequest({ user: email, password }));
			}
			if (error.data?.error) {
				logEvent(events.REGISTER_DEFAULT_SIGN_UP_F);
				showErrorAlert(error.data.error, I18n.t('Oops'));
			}
		} finally {
			setSaving(false);
		}
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: route?.params?.title,
			headerRight: () => (
				<HeaderButton.Legal accessibilityLabel={I18n.t('Legal')} testID='register-view-more' navigation={navigation} />
			)
		});
	}, []);

	return (
		<FormContainer testID='register-view'>
			<FormContainerInner accessibilityLabel={I18n.t('Sign_Up')}>
				<LoginServices separator />
				<View accessible accessibilityLabel={I18n.t('Sign_Up')}>
					<Text accessible accessibilityLabel={I18n.t('Sign_Up')} style={[styles.title, { color: colors.fontTitlesLabels }]}>
						{I18n.t('Sign_Up')}
					</Text>
				</View>

				<View style={styles.inputs}>
					<Controller
						name='name'
						control={control}
						render={({ field: { onChange, value, ref } }) => (
							<FormTextInput
								inputRef={ref}
								testID='register-view-name'
								textContentType='name'
								autoComplete='name'
								returnKeyType='next'
								required
								label={I18n.t('Full_name')}
								value={value}
								onChangeText={onChange}
								onSubmitEditing={() => setFocus('username')}
								containerStyle={styles.inputContainer}
							/>
						)}
					/>
					<Controller
						name='username'
						control={control}
						render={({ field: { onChange, value, ref } }) => (
							<FormTextInput
								inputRef={ref}
								testID='register-view-username'
								textContentType='username'
								autoComplete='username'
								returnKeyType='next'
								required
								label={I18n.t('Username')}
								value={value}
								onChangeText={onChange}
								onSubmitEditing={() => {
									setFocus('email');
								}}
								containerStyle={styles.inputContainer}
							/>
						)}
					/>
					<Controller
						name='email'
						control={control}
						render={({ field: { onChange, value, ref } }) => (
							<FormTextInput
								inputRef={ref}
								testID='register-view-email'
								keyboardType='email-address'
								textContentType='emailAddress'
								autoComplete='email'
								returnKeyType='next'
								required
								label={I18n.t('Email')}
								value={value}
								onChangeText={onChange}
								onSubmitEditing={() => {
									setFocus('password');
								}}
								containerStyle={styles.inputContainer}
							/>
						)}
					/>
					<Controller
						name='password'
						control={control}
						render={({ field: { onChange, value, ref } }) => (
							<FormTextInput
								inputRef={ref}
								testID='register-view-password'
								textContentType='newPassword'
								autoComplete='password-new'
								returnKeyType='next'
								required
								label={I18n.t('Password')}
								value={value}
								onChangeText={onChange}
								secureTextEntry
								onSubmitEditing={() => {
									setFocus('confirmPassword');
								}}
								containerStyle={styles.inputContainer}
							/>
						)}
					/>
					<Controller
						name='confirmPassword'
						control={control}
						render={({ field: { onChange, value, ref } }) => (
							<FormTextInput
								accessibilityLabel={`${I18n.t('Confirm_Password')}`}
								inputRef={ref}
								testID='register-view-confirm-password'
								textContentType='newPassword'
								autoComplete='password-new'
								returnKeyType='next'
								required
								value={value}
								onChangeText={onChange}
								onSubmitEditing={() => {
									if (parsedCustomFields) {
										focusOnCustomFields();
										return;
									}
									handleSubmit(onSubmit)();
								}}
								secureTextEntry
								containerStyle={styles.inputContainer}
							/>
						)}
					/>
					<CustomFields
						customFieldsRef={customFieldsRef}
						Accounts_CustomFields={Accounts_CustomFields}
						customFields={customFields}
						onCustomFieldChange={value => setCustomFields(value)}
						onSubmit={handleSubmit(onSubmit)}
					/>
				</View>
				{passwordPolicies ? (
					<PasswordPolicies
						policies={passwordPolicies}
						isDirty={(dirtyFields.password || dirtyFields.confirmPassword) ?? false}
						password={password}
					/>
				) : null}

				<Button
					disabled={!isValid || !isPasswordValid() || !validateDefaultFormInfo()}
					testID='register-view-submit'
					title={I18n.t('Register')}
					type='primary'
					onPress={handleSubmit(onSubmit)}
					loading={saving}
					style={styles.registerButton}
				/>

				{showLoginButton ? (
					<View style={styles.bottomContainer}>
						<Text style={[styles.bottomContainerText, { color: colors.fontSecondaryInfo }]}>
							{I18n.t('Already_have_an_account')}
						</Text>
						<Button title={I18n.t('Login')} type='secondary' onPress={login} style={styles.loginButton} />
					</View>
				) : null}
				<UGCRules />
			</FormContainerInner>
		</FormContainer>
	);
};

export default RegisterView;
