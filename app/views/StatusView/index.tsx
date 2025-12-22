import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
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
import Check from '../../containers/Check';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../lib/constants/maxLength';

interface IStatus {
	_id: string;
	name: string;
	statusType: TUserStatus;
	isCustom?: boolean;
}

const STATUS: IStatus[] = [
	{
		_id: 'online',
		name: 'Online',
		statusType: 'online'
	},
	{
		_id: 'busy',
		name: 'Busy',
		statusType: 'busy'
	},
	{
		_id: 'away',
		name: 'Away',
		statusType: 'away'
	},
	{
		_id: 'offline',
		name: 'Offline',
		statusType: 'offline'
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
	statusText,
	setStatus,
	isCustom,
	isCustomSelected
}: {
	statusType: IStatus;
	status: TUserStatus;
	statusText: string;
	setStatus: (status: TUserStatus, statusText: string) => void;
	isCustom?: boolean;
	isCustomSelected: boolean;
}) => {
	const { _id, name } = statusType;
	const acessibilityLabel = useMemo(() => {
		if (status === _id) {
			if (isCustom) {
				return name;
			}
			return I18n.t('Current_Status');
		}
		return '';
	}, [status, _id, isCustom]);

	const checked = useMemo(() => {
		if (isCustomSelected) {
			return statusText === name;
		}

		return status === statusType._id;
	}, [statusText, name, status, statusType]);

	return (
		<>
			<List.Item
				additionalAcessibilityLabel={acessibilityLabel}
				title={name}
				translateTitle={!isCustom}
				onPress={() => {
					const key = `STATUS_${statusType._id.toUpperCase()}` as keyof typeof events;
					logEvent(events[key]);
					if (status !== statusType._id) {
						setStatus(statusType.statusType, statusType.isCustom ? statusType.name : statusText);
					}
				}}
				testID={`status-view-${_id}`}
				left={() => <StatusIcon size={24} status={statusType.statusType} />}
				right={() => (checked ? <Check /> : null)}
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
	const customUserStatus = useSelector((state: IApplicationState) => state.customUserStatus);

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
	const inputValues = watch();
	const { statusText } = inputValues;

	const dispatch = useDispatch();
	const { setOptions, goBack } = useNavigation();
	const { colors } = useTheme();

	const submit = async () => {
		const { status } = inputValues;
		logEvent(events.STATUS_DONE);
		if (statusText !== user.statusText || status !== user.status) {
			await setCustomStatus(status, statusText);
		}
		goBack();
	};

	useA11yErrorAnnouncement({ errors, inputValues });

	useEffect(() => {
		const setHeader = () => {
			setOptions({
				title: I18n.t('Edit_Status'),
				headerLeft: isMasterDetail ? undefined : () => <HeaderButton.CloseModal onPress={goBack} />
			});
		};
		setHeader();
	}, [isMasterDetail]);

	const setStatus = (status: TUserStatus, statusText: string) => {
		setValue('status', status);
		if (statusText) {
			setValue('statusText', statusText);
		}
	};

	const setCustomStatus = async (status: TUserStatus, statusText: string) => {
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
	};

	const AllStatus = [...STATUS, ...customUserStatus.map(s => ({ ...s, isCustom: true }))];
	const statusType = Accounts_AllowInvisibleStatusOption ? AllStatus : AllStatus.filter(s => s._id !== 'offline');

	const isCustomSelected = useMemo(
		() => !!customUserStatus.find(s => s.statusType === inputValues.status && s.name === inputValues.statusText),
		[inputValues.status, inputValues.statusText, statusType]
	);

	const isStatusChanged = () => {
		const { status } = inputValues;
		if (!isValid) {
			return true;
		}
		const isStatusEqual = status === user.status;
		const isStatusTextEqual = (!!user.statusText && user.statusText === statusText) ?? (!user.statusText && !statusText);
		return !isValid && isStatusEqual && isStatusTextEqual;
	};

	const FooterComponent = () => (
		<View style={styles.footerComponent}>
			<Button testID='status-view-submit' disabled={isStatusChanged()} onPress={submit} title={I18n.t('Save')} />
		</View>
	);

	return (
		<SafeAreaView testID='status-view'>
			<FlatList
				data={statusType}
				keyExtractor={item => item._id}
				renderItem={({ item }) => (
					<Status
						statusType={item}
						statusText={inputValues.statusText}
						status={inputValues.status}
						setStatus={setStatus}
						isCustom={item.isCustom}
						isCustomSelected={isCustomSelected}
					/>
				)}
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
