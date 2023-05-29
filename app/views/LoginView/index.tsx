import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Alert } from 'react-native';

import { useAppSelector } from '../../lib/hooks';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import LoginServices from '../../containers/LoginServices';
import { OutsideParamList } from '../../stacks/types';
import UserForm, { UserFormRef } from './UserForm';
import I18n from '../../i18n';

const LoginView = () => {
	const userFormRef = useRef<UserFormRef | null>(null);

	const navigation = useNavigation<StackNavigationProp<OutsideParamList, 'LoginView'>>();
	const {
		params: { title }
	} = useRoute<RouteProp<OutsideParamList, 'LoginView'>>();

	const { Accounts_ShowFormLogin, error, failure } = useAppSelector(state => ({
		Accounts_ShowFormLogin: state.settings.Accounts_ShowFormLogin as boolean,
		failure: state.login.failure,
		error: state.login.error && state.login.error.data
	}));

	useLayoutEffect(() => {
		navigation.setOptions({
			title: title ?? 'Rocket.Chat',
			headerRight: () => <HeaderButton.Legal testID='login-view-more' navigation={navigation} />
		});
	}, [navigation, title]);

	useEffect(() => {
		if (failure) {
			if (error?.error === 'error-invalid-email' && userFormRef.current) {
				const user = userFormRef.current.getUser();
				navigation.navigate('SendEmailConfirmationView', { user });
			} else {
				Alert.alert(I18n.t('Oops'), I18n.t('Login_error'));
			}
		}
	}, [error?.error, failure, navigation]);

	return (
		<FormContainer testID='login-view'>
			<FormContainerInner>
				<LoginServices separator={Accounts_ShowFormLogin} />
				{Accounts_ShowFormLogin ? <UserForm ref={userFormRef} /> : null}
			</FormContainerInner>
		</FormContainer>
	);
};

export default LoginView;
