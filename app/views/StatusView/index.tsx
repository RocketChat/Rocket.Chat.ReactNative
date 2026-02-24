import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import useA11yErrorAnnouncement from '../../lib/hooks/useA11yErrorAnnouncement';
import { setUser } from '../../actions/login';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import * as List from '../../containers/List';
import { sendLoadingEvent } from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusIcon from '../../containers/Status/Status';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { type IApplicationState, type TUserStatus } from '../../definitions';
import I18n from '../../i18n';
import { showToast } from '../../lib/methods/helpers/showToast';
import { setUserStatus } from '../../lib/services/restApi';
import { getUserSelector } from '../../selectors/login';
import { showErrorAlert } from '../../lib/methods/helpers';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { useTheme } from '../../theme';
import Button from '../../containers/Button';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../lib/constants/maxLength';

interface IStatus {
	id: TUserStatus;
	name: string;
}

const STATUS: IStatus[] = [
	{
		id: 'online',
		name: 'Online'
	},
	{
		id: 'busy',
		name: 'Busy'
	},
	{
		id: 'away',
		name: 'Away'
	},
	{
		id: 'offline',
		name: 'Offline'
	}
];

const styles = StyleSheet.create({
	inputContainer: {
		paddingHorizontal: 16,
		marginTop: 24,
		marginBottom: 12
	},
	inputStyle: {
		borderRadius: 0,
		borderTopWidth: 1,
		borderBottomWidth: 1
	},
	footerComponent: {
		marginTop: 36,
		paddingHorizontal: 16
	}
});

const Status = ({
	statusType,
	status,
	setStatus
}: {
	statusType: IStatus;
	status: TUserStatus;
	setStatus: (status: TUserStatus) => void;
}) => {
	const { id, name } = statusType;
	return (
		<>
			<List.Radio
				isSelected={status === id}
				additionalAccessibilityLabel={`${status === id ? I18n.t('Current_Status') : ''}`}
				title={name}
				onPress={() => {
					const key = `STATUS_${id.toUpperCase()}` as keyof typeof events;
					logEvent(events[key]);
					if (status !== id) {
						setStatus(id);
					}
				}}
				testID={`status-view-${id}`}
				value={statusType.id}
				left={() => <StatusIcon size={24} status={statusType.id} />}
			/>
			<List.Separator />
		</>
	);
};

const StatusView = (): React.ReactElement => {
	const validationSchema = yup.object().shape({
		statusText: yup
			.string()
			.max(USER_STATUS_TEXT_MAX_LENGTH, I18n.t('Status_text_limit_exceeded', { limit: USER_STATUS_TEXT_MAX_LENGTH }))
	});

	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const Accounts_AllowInvisibleStatusOption = useSelector(
		(state: IApplicationState) => state.settings.Accounts_AllowInvisibleStatusOption
	);

	const {
		control,
		watch,
		setValue,
		formState: { errors, isValid }
	} = useForm({
		mode: 'onChange',
		defaultValues: { statusText: user.statusText || '', status: user.status },

		resolver: yupResolver(validationSchema)
	});
	const watchedStatus = watch('status');
	const statusText = watch('statusText');

	const dispatch = useDispatch();
	const { setOptions, goBack } = useNavigation();
	const { colors } = useTheme();

	const setCustomStatus = useCallback(
		async (status: TUserStatus, statusText: string) => {
			sendLoadingEvent({ visible: true });
			try {
				await setUserStatus(status, statusText);
				dispatch(setUser({ statusText, status }));
				logEvent(events.STATUS_CUSTOM);
				showToast(I18n.t('Status_saved_successfully'));
			} catch (e: any) {
				const messageError =
					e.error && e.error.includes('[error-too-many-requests]')
						? I18n.t('error-too-many-requests', { seconds: e.reason.replace(/\D/g, '') })
						: e.reason;
				logEvent(events.STATUS_CUSTOM_F);
				showErrorAlert(messageError);
				log(e);
			}
			sendLoadingEvent({ visible: false });
		},
		[dispatch]
	);

	const submit = useCallback(async () => {
		logEvent(events.STATUS_DONE);
		if (statusText !== user.statusText || watchedStatus !== user.status) {
			await setCustomStatus(watchedStatus, statusText);
		}
		goBack();
	}, [statusText, user.statusText, watchedStatus, user.status, goBack, setCustomStatus]);

	useA11yErrorAnnouncement({ errors, inputValues: { status: watchedStatus, statusText } });

	useEffect(() => {
		const setHeader = () => {
			setOptions({
				title: I18n.t('Edit_Status'),
				headerLeft: isMasterDetail ? undefined : () => <HeaderButton.CloseModal onPress={goBack} />
			});
		};
		setHeader();
	}, [isMasterDetail, goBack, setOptions]);

	const setStatus = (updatedStatus: TUserStatus) => {
		setValue('status', updatedStatus);
	};

	const statusType = Accounts_AllowInvisibleStatusOption ? STATUS : STATUS.filter(s => s.id !== 'offline');

	const isSaveDisabled = useMemo(() => {
		if (!isValid) return true;
		const isStatusEqual = watchedStatus === user.status;
		const isStatusTextEqual = statusText === (user.statusText ?? '');
		return isStatusEqual && isStatusTextEqual;
	}, [isValid, watchedStatus, statusText, user.status, user.statusText]);

	const FooterComponent = useCallback(
		() => (
			<View style={styles.footerComponent}>
				<Button testID='status-view-submit' disabled={isSaveDisabled} onPress={submit} title={I18n.t('Save')} />
			</View>
		),
		[isSaveDisabled, submit]
	);

	return (
		<SafeAreaView testID='status-view'>
			<FlatList
				data={statusType}
				keyExtractor={item => item.id}
				renderItem={({ item }) => <Status statusType={item} status={watchedStatus} setStatus={setStatus} />}
				ListHeaderComponent={
					<>
						<ControlledFormTextInput
							name='statusText'
							control={control}
							label={I18n.t('Message')}
							value={statusText}
							containerStyle={styles.inputContainer}
							inputStyle={styles.inputStyle}
							testID='status-view-input'
							error={errors.statusText?.message}
						/>
						<List.Separator />
					</>
				}
				ListFooterComponent={FooterComponent}
				style={{ backgroundColor: colors.surfaceTint }}
			/>
		</SafeAreaView>
	);
};

export default StatusView;
