import { useLayoutEffect } from 'react';
import { useNavigation, type StaticScreenProps } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppSelector } from '~/lib/hooks/useAppSelector';
import FormContainer, { FormContainerInner } from '~/containers/FormContainer';
import LoginServices from '~/containers/LoginServices';
import { outsideHeaderRightLegal } from '~/lib/methods/helpers/navigation';
import { type OutsideParamList } from '~/stacks/types';
import UserForm from './UserForm';

type LoginViewProps = StaticScreenProps<{ title: string; username?: string }>;

const LoginView = ({ route }: LoginViewProps) => {
	const navigation = useNavigation<NativeStackNavigationProp<OutsideParamList, 'LoginView'>>();

	const {
		params: { title }
	} = route;

	const { Accounts_ShowFormLogin } = useAppSelector(state => ({
		Accounts_ShowFormLogin: state.settings.Accounts_ShowFormLogin as boolean
	}));

	useLayoutEffect(() => {
		navigation.setOptions({
			title: title ?? 'Rocket.Chat',
			...outsideHeaderRightLegal(navigation, 'login-view-more')
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
