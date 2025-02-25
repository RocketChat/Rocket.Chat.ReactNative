import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { loginRequest } from '../actions/login';
import Button from '../containers/Button';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { ControlledFormTextInput } from '../containers/TextInput';
import { SetUsernameStackParamList } from '../definitions/navigationTypes';
import I18n from '../i18n';
import KeyboardView from '../containers/KeyboardView';
import { getUserSelector } from '../selectors/login';
import { useTheme } from '../theme';
import { showErrorAlert } from '../lib/methods/helpers';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import sharedStyles from './Styles';
import { Services } from '../lib/services';
import { useAppSelector } from '../lib/hooks';

const styles = StyleSheet.create({
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

interface ISubmit {
	username: string;
	name: string;
}

const schema = yup.object().shape({
	username: yup.string().required(),
	name: yup.string().required()
});

const SetUsernameView = () => {
	const {
		control,
		handleSubmit,
		formState: { isValid },
		setValue
	} = useForm<ISubmit>({ mode: 'onChange', resolver: yupResolver(schema) });
	const [loading, setLoading] = useState(false);

	const { colors } = useTheme();
	const dispatch = useDispatch();
	const { server, token } = useAppSelector(state => ({ server: state.server.server, token: getUserSelector(state).token }));

	const navigation = useNavigation<NativeStackNavigationProp<SetUsernameStackParamList, 'SetUsernameView'>>();

	useLayoutEffect(() => {
		navigation.setOptions({ title: server });
	}, [navigation, server]);

	useEffect(() => {
		const init = async () => {
			const suggestion = await Services.getUsernameSuggestion();
			if (suggestion.success) {
				setValue('username', suggestion.result, { shouldValidate: true });
			}
		};
		init();
	}, []);

	const submit = async ({ username, name }: ISubmit) => {
		if (!isValid) {
			return;
		}
		setLoading(true);
		try {
			await Services.saveUserProfile({ username, name });
			dispatch(loginRequest({ resume: token }));
		} catch (e: any) {
			showErrorAlert(e.message, I18n.t('Oops'));
		}
		setLoading(false);
	};

	return (
		<KeyboardView style={{ backgroundColor: colors.surfaceHover }} contentContainerStyle={sharedStyles.container}>
			<StatusBar />
			<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
				<SafeAreaView testID='set-username-view'>
					<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, styles.loginTitle, { color: colors.fontTitlesLabels }]}>
						{I18n.t('Username')}
					</Text>
					<Text style={[sharedStyles.loginSubtitle, sharedStyles.textRegular, { color: colors.fontTitlesLabels }]}>
						{I18n.t('Set_username_subtitle')}
					</Text>
					<ControlledFormTextInput
						control={control}
						name='username'
						autoFocus
						placeholder={I18n.t('Username')}
						returnKeyType='send'
						onSubmitEditing={handleSubmit(submit)}
						testID='set-username-view-input'
						clearButtonMode='while-editing'
						containerStyle={sharedStyles.inputLastChild}
					/>
					<Text
						style={[
							sharedStyles.loginTitle,
							sharedStyles.textBold,
							styles.loginTitle,
							{ color: colors.fontTitlesLabels, marginBottom: 10 }
						]}>
						{I18n.t('Name')}
					</Text>
					<ControlledFormTextInput
						control={control}
						name='name'
						autoFocus
						placeholder={I18n.t('Name')}
						returnKeyType='send'
						onSubmitEditing={handleSubmit(submit)}
						testID='set-name-view-input'
						clearButtonMode='while-editing'
						containerStyle={sharedStyles.inputLastChild}
					/>
					<Button
						title={I18n.t('Register')}
						type='primary'
						onPress={handleSubmit(submit)}
						testID='set-username-view-submit'
						disabled={!isValid}
						loading={loading}
					/>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default SetUsernameView;
