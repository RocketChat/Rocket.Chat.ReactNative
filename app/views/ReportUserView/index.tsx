import React, { useLayoutEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import useA11yErrorAnnouncement from '../../lib/hooks/useA11yErrorAnnouncement';
import log from '../../lib/methods/helpers/log';
import SafeAreaView from '../../containers/SafeAreaView';
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
import Navigation from '../../lib/navigation/appNavigation';

type TReportUserViewNavigationProp = CompositeNavigationProp<
	NativeStackNavigationProp<ChatsStackParamList, 'ReportUserView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

type TReportUserViewRouteProp = RouteProp<ChatsStackParamList, 'ReportUserView'>;

interface ISubmit {
	description: string;
}

const schema = yup.object().shape({
	description: yup.string().trim().required(I18n.t('Report_reason_required'))
});

const ReportUserView = () => {
	const [loading, setLoading] = useState(false);
	const navigation = useNavigation<TReportUserViewNavigationProp>();
	const { isMasterDetail } = useAppSelector(state => ({ isMasterDetail: state.app.isMasterDetail }));
	const {
		params: { username, userId, name }
	} = useRoute<TReportUserViewRouteProp>();

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors }
	} = useForm<ISubmit>({
		mode: 'onChange',
		resolver: yupResolver(schema),
		defaultValues: { description: '' }
	});

	const inputValues = watch();

	useA11yErrorAnnouncement({ errors, inputValues });

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
			Navigation.resetTo();
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	return (
		<KeyboardView>
			<SafeAreaView style={styles.containerView} testID='report-user-view'>
				<ScrollView contentContainerStyle={styles.scroll}>
					<UserInfo username={username} name={name} />
					<ControlledFormTextInput
						name='description'
						control={control}
						label={I18n.t('Why_do_you_want_to_report')}
						error={errors.description?.message}
						multiline
						inputStyle={styles.textInput}
						testID='report-user-view-input'
						containerStyle={styles.containerTextInput}
					/>
					<Button
						title={I18n.t('Report')}
						type='primary'
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
