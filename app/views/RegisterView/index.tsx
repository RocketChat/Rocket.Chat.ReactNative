import React, { useLayoutEffect, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import parse from 'url-parse';
import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form';

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
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import sharedStyles from '../Styles';
import { Services } from '../../lib/services';
import UGCRules from '../../containers/UserGeneratedContentRules';
import { useAppSelector } from '../../lib/hooks';
import PasswordTips from './PasswordTips';

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 22
	},
	inputs: {
		gap: 12,
		paddingTop: 24,
		paddingBottom: 12
	},
	inputContainer: {
		marginTop: 0,
		marginBottom: 0
	},
	bottomContainer: {
		marginBottom: 32
	},
	bottomContainerText: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 22,
		alignSelf: 'center'
	},
	registerButton: {
		marginTop: 36,
		marginBottom: 32
	},
	loginButton: {
		marginTop: 12
	}
});

const passwordRules = /^(?!.*(.)\1{2})^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,24}$/;

const validationSchema = yup.object().shape({
	name: yup.string().min(1).required(),
	email: yup.string().email().required(),
	username: yup.string().min(1).required(),
	password: yup.string().matches(passwordRules).required(),
	confirmPassword: yup
		.string()
		.oneOf([yup.ref('password'), null])
		.required()
});

interface IProps extends IBaseScreen<OutsideParamList, 'RegisterView'> {}

const RegisterView = ({ navigation, route, dispatch }: IProps) => {
	const getCustomFields = () => {
		let customFields: any;
		Object.keys(parsedCustomFields).forEach((key: string) => {
			if (parsedCustomFields[key].defaultValue) {
				customFields[key] = parsedCustomFields[key].defaultValue;
			}
		});

		return customFields;
	};

	const getParsedCustomFields = () => {
		let parsedCustomFields: any = {};
		if (Accounts_CustomFields) {
			try {
				parsedCustomFields = JSON.parse(Accounts_CustomFields);
			} catch (e) {
				log(e);
			}
		}

		return parsedCustomFields;
	};

	const parsedCustomFields = getParsedCustomFields();
	const [customFields, setCustomFields] = useState(getCustomFields());

	const { colors } = useTheme();
	const [saving, setSaving] = useState(false);
	const { control, handleSubmit, setFocus, getValues } = useForm({
		defaultValues: {
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
			username: ''
		}
	});

	const { Accounts_CustomFields, Site_Url, Accounts_EmailVerification, Accounts_ManuallyApproveNewUsers, showLoginButton } =
		useAppSelector(state => ({
			...state.settings,
			showLoginButton: getShowLoginButton(state),
			Site_Url: state.settings.Site_Url as string,
			Accounts_CustomFields: state.settings.Accounts_CustomFields as string
		}));

	const login = () => {
		navigation.navigate('LoginView', { title: new parse(Site_Url).hostname });
	};

	const valid = () => {
		const isValid = validationSchema.isValidSync(getValues());
		let requiredCheck = true;
		Object.keys(parsedCustomFields).forEach((key: string) => {
			if (parsedCustomFields[key].required) {
				requiredCheck = requiredCheck && customFields[key] && Boolean(customFields[key].trim());
			}
		});
		return isValid && requiredCheck;
	};

	const onSubmit = async (data: any) => {
		logEvent(events.REGISTER_DEFAULT_SIGN_UP);

		const { name, email, password, username } = data;

		if (!valid()) {
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

	const renderCustomFields = () => {
		if (!Accounts_CustomFields) {
			return null;
		}
		try {
			return (
				<>
					{Object.keys(parsedCustomFields).map((key, index, array) => {
						if (parsedCustomFields[key].type === 'select') {
							const options = parsedCustomFields[key].options.map((option: string) => ({ label: option, value: option }));
							return (
								<RNPickerSelect
									key={key}
									items={options}
									onValueChange={value => {
										const newValue: { [key: string]: string | number } = {};
										newValue[key] = value;
										setCustomFields({ customFields: { ...customFields, ...newValue } });
									}}
									value={customFields[key]}>
									<FormTextInput
										inputRef={e => {
											// @ts-ignore
											this[key] = e;
										}}
										placeholder={key}
										value={customFields[key]}
										testID='register-view-custom-picker'
									/>
								</RNPickerSelect>
							);
						}

						return (
							<FormTextInput
								inputRef={e => {
									// @ts-ignore
									this[key] = e;
								}}
								key={key}
								label={key}
								placeholder={key}
								value={customFields[key]}
								onChangeText={(value: string) => {
									const newValue: { [key: string]: string | number } = {};
									newValue[key] = value;
									setCustomFields({ customFields: { ...customFields, ...newValue } });
								}}
								onSubmitEditing={() => {
									if (array.length - 1 > index) {
										// @ts-ignore
										return this[array[index + 1]].focus();
									}
								}}
								containerStyle={styles.inputContainer}
							/>
						);
					})}
				</>
			);
		} catch (error) {
			return null;
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
			<FormContainerInner>
				<LoginServices separator />
				<Text style={[styles.title, sharedStyles.textBold, { color: colors.fontTitlesLabels }]}>{I18n.t('Sign_Up')}</Text>
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
								secureTextEntry
								containerStyle={styles.inputContainer}
							/>
						)}
					/>
					{renderCustomFields()}
				</View>
				<PasswordTips />
				<Button
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
