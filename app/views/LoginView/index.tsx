import React, { useLayoutEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '../../lib/hooks';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import LoginServices from '../../containers/LoginServices';
import { OutsideParamList } from '../../stacks/types';
import UserForm from './UserForm';

const LoginView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<OutsideParamList, 'LoginView'>>();

	const {
		params: { title }
	} = useRoute<RouteProp<OutsideParamList, 'LoginView'>>();

	const { Accounts_ShowFormLogin } = useAppSelector(state => ({
		Accounts_ShowFormLogin: state.settings.Accounts_ShowFormLogin as boolean
	}));

	useLayoutEffect(() => {
		navigation.setOptions({
			title: title ?? 'Rocket.Chat',
			headerRight: () => <HeaderButton.Legal testID='login-view-more' navigation={navigation} />
		});
	}, [navigation, title]);

	return (
		<FormContainer testID='login-view'>
			<FormContainerInner>
				<LoginServices separator={Accounts_ShowFormLogin} />
				{Accounts_ShowFormLogin ? <UserForm /> : null}
			</FormContainerInner>
		</FormContainer>
	);
};

export default LoginView;
