import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import log from '../../lib/methods/helpers/log';
import SafeAreaView from '../../containers/SafeAreaView';
import { useTheme } from '../../theme';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import I18n from '../../i18n';
import UserInfo from './UserInfo';
import styles from './styles';
import { ControlledFormTextInput } from '../../containers/TextInput';
import Button from '../../containers/Button';
import { useAppSelector } from '../../lib/hooks';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import { Services } from '../../lib/services';
import KeyboardView from '../../containers/KeyboardView';

type TReportUserViewNavigationProp = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'ReportUserView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

type TReportUserViewRouteProp = RouteProp<ChatsStackParamList, 'ReportUserView'>;

interface ISubmit {
	description: string;
}

const schema = yup.object().shape({
	description: yup.string().trim().required()
});

const ReportUserView = () => {
	const [loading, setLoading] = useState(false);
	const { colors } = useTheme();
	const navigation = useNavigation<TReportUserViewNavigationProp>();
	const { isMasterDetail } = useAppSelector(state => ({ isMasterDetail: state.app.isMasterDetail }));

	const {
		params: { username, userId, name }
	} = useRoute<TReportUserViewRouteProp>();

	const {
		control,
		handleSubmit,
		formState: { isValid }
	} = useForm<ISubmit>({ mode: 'onChange', resolver: yupResolver(schema), defaultValues: { description: '' } });

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: I18n.t('Report_user')
		});
	}, [navigation]);

	const submit = async ({ description }: ISubmit) => {
		try {
			setLoading(true);
			await Services.reportUser(userId, description);
			EventEmitter.emit(LISTENER, { message: I18n.t('Report_sent_successfully') });
			setLoading(false);
			if (isMasterDetail) {
				navigation.navigate('DrawerNavigator');
				return;
			}
			navigation.navigate('RoomView');
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	return (
		<KeyboardView
			style={{ backgroundColor: colors.surfaceTint }}
			contentContainerStyle={styles.container}
			keyboardVerticalOffset={128}>
			<SafeAreaView style={[styles.containerView]} testID='report-user-view'>
				<ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: colors.surfaceTint }]}>
					<StatusBar />
					<UserInfo username={username} name={name} />
					<ControlledFormTextInput
						name='description'
						control={control}
						label={I18n.t('Why_do_you_want_to_report')}
						multiline
						inputStyle={styles.textInput}
						testID='report-user-view-input'
						containerStyle={styles.containerTextInput}
					/>
					<Button
						title={I18n.t('Report')}
						type='primary'
						disabled={!isValid}
						onPress={handleSubmit(submit)}
						testID='report-user-view-submit'
						loading={loading}
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ReportUserView;
