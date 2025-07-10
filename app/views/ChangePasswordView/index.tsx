import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import SafeAreaView from '../../containers/SafeAreaView';
import { ProfileStackParamList } from '../../stacks/types';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { useAppSelector } from '../../lib/hooks';
import { isAndroid } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import KeyboardView from '../../containers/KeyboardView';
import StatusBar from '../../containers/StatusBar';
import Button from '../../containers/Button';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import sharedStyles from '../Styles';
import PasswordPolicies from '../../containers/PasswordPolicies';
import useVerifyPassword from '../../lib/hooks/useVerifyPassword';

const styles = StyleSheet.create({
	disabled: {
		opacity: 0.3
	},
	inputContainer: {
		marginBottom: 0,
		marginTop: 0
	},
	createNewPasswordTitle: {
		...sharedStyles.textBold,
		lineHeight: 36,
		fontSize: 24
	}
});

const validationSchema = yup.object().shape({
	currentPassword: yup.string().min(1).required(),
	newPassword: yup.string().email().required(),
	confirmNewPassword: yup.string().min(1).required()
});

interface IChangePasswordViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'ChangePasswordView'>;
}

const ChangePasswordView = ({ navigation }: IChangePasswordViewProps) => {
	const { colors } = useTheme();
	const { Accounts_AllowPasswordChange, serverURL } = useAppSelector(state => ({
		Accounts_AllowPasswordChange: state.settings.Accounts_AllowPasswordChange as boolean,
		serverURL: state.server.server
	}));
	const {
		control,
		watch,
		formState: { isDirty }
	} = useForm({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: ''
		},
		resolver: yupResolver(validationSchema)
	});
	const newPassword = watch('newPassword') ?? '';
	const { isPasswordValid, passwordPolicies } = useVerifyPassword(newPassword, newPassword);

	const onCancel = () => {
		navigation.goBack();
	};

	const onSetNewPassword = () => {};

	useLayoutEffect(() => {
		const server = serverURL?.replace(/(^\w+:|^)\/\//, '');
		navigation.setOptions({
			headerTitle: server
		});
	}, [navigation, serverURL]);

	return (
		<KeyboardView>
			<StatusBar />
			<SafeAreaView testID='profile-view'>
				<ScrollView
					contentContainerStyle={[sharedStyles.containerScrollView, { backgroundColor: colors.surfaceTint, paddingTop: 32 }]}
					testID='profile-view-list'
					{...scrollPersistTaps}>
					<Text style={styles.createNewPasswordTitle}>Create new password</Text>

					<ControlledFormTextInput
						name='currentPassword'
						control={control}
						editable={Accounts_AllowPasswordChange}
						inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
						label={I18n.t('Current_password')}
						placeholder={I18n.t('Current_password')}
						textContentType={isAndroid ? 'password' : undefined}
						autoComplete={isAndroid ? 'password' : undefined}
						secureTextEntry
						required
						containerStyle={styles.inputContainer}
						testID='change-password-view-current-password'
					/>

					<ControlledFormTextInput
						name='newPassword'
						control={control}
						editable={Accounts_AllowPasswordChange}
						inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
						label={I18n.t('New_Password')}
						placeholder={I18n.t('New_Password')}
						textContentType={isAndroid ? 'newPassword' : undefined}
						autoComplete={isAndroid ? 'password-new' : undefined}
						secureTextEntry
						required
						containerStyle={styles.inputContainer}
						testID='change-password-view-new-password'
					/>

					<ControlledFormTextInput
						name='confirmNewPassword'
						control={control}
						editable={Accounts_AllowPasswordChange}
						inputStyle={[!Accounts_AllowPasswordChange && styles.disabled]}
						textContentType={isAndroid ? 'newPassword' : undefined}
						autoComplete={isAndroid ? 'password-new' : undefined}
						secureTextEntry
						required
						containerStyle={styles.inputContainer}
						testID='change-password-view-confirm-new-password'
					/>

					{passwordPolicies && newPassword?.length > 0 ? (
						<PasswordPolicies isDirty={isDirty} password={newPassword} policies={passwordPolicies} />
					) : null}

					<Button title={I18n.t('Cancel')} type='secondary' onPress={onCancel} testID='change-password-view-cancel-button' />
					<Button
						disabled={!isPasswordValid}
						title={I18n.t('Set_new_password')}
						type='primary'
						onPress={onSetNewPassword}
						testID='change-password-view-set-new-password-button'
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ChangePasswordView;
