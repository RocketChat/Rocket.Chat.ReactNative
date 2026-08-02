import { useNavigation } from '@react-navigation/native';
import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useA11yErrorAnnouncement from '../../lib/hooks/useA11yErrorAnnouncement';
import { setUser } from '../../actions/login';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import * as List from '../../containers/List';
import { sendLoadingEvent } from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusIcon from '../../containers/Status/Status';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { type IApplicationState, type TUserStatus } from '../../definitions';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import I18n from '../../i18n';
import { showToast } from '../../lib/methods/helpers/showToast';
import { setUserStatus } from '../../lib/services/restApi';
import { getUserSelector } from '../../selectors/login';
import { showErrorAlertWithEMessage, compareServerVersion } from '../../lib/methods/helpers';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { useTheme } from '../../theme';
import { USER_STATUS_TEXT_MAX_LENGTH } from '../../lib/constants/maxLength';
import { type ClearAfterValue, computeExpiresAt, getInitialClearAfterState } from './ClearAfterPicker';
import FooterComponent from './FooterComponent';

const validationSchema = yup.object().shape({
	statusText: yup
		.string()
		.max(USER_STATUS_TEXT_MAX_LENGTH, I18n.t('Status_text_limit_exceeded', { limit: USER_STATUS_TEXT_MAX_LENGTH }))
});

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
	}
});

const Status = ({
	option,
	status,
	statusText,
	setStatus,
	isCustom
}: {
	option: IStatus;
	status: TUserStatus;
	statusText: string;
	setStatus: (status: TUserStatus, statusText: string) => void;
	isCustom?: boolean;
}) => {
	'use memo';

	const { _id, name } = option;
	const isSelected = isCustom ? status === option.statusType && statusText === name : status === _id && !statusText;
	return (
		<>
			<List.Radio
				isSelected={isSelected}
				title={name}
				translateTitle={!isCustom}
				onPress={() => {
					if (isCustom) {
						if (status !== option.statusType || statusText !== name) {
							setStatus(option.statusType, name);
						}
					} else {
						const key = `STATUS_${_id.toUpperCase()}` as keyof typeof events;
						logEvent(events[key]);
						if (status !== _id || statusText) {
							setStatus(_id as TUserStatus, '');
						}
					}
				}}
				testID={`status-view-${_id}`}
				value={_id}
				left={() => <StatusIcon size={24} status={option.statusType} />}
			/>
			<List.Separator />
		</>
	);
};

const StatusView = (): ReactElement => {
	'use memo';

	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const isMasterDetail = useMasterDetail();
	const Accounts_AllowInvisibleStatusOption = useSelector(
		(state: IApplicationState) => state.settings.Accounts_AllowInvisibleStatusOption
	);
	const customUserStatus = useSelector((state: IApplicationState) => state.customUserStatus);
	const serverVersion = useSelector((state: IApplicationState) => state.server.version);
	const supportsStatusExpiry = compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '8.6.0');

	const defaultFormValues = useMemo(() => ({ statusText: user.statusText || '', status: user.status }), []);

	const {
		control,
		watch,
		setValue,
		formState: { errors, isValid }
	} = useForm({
		mode: 'onChange',
		defaultValues: defaultFormValues,
		resolver: yupResolver(validationSchema)
	});
	const inputValues = watch();
	const { statusText } = inputValues;

	const initialClearAfterState = useMemo(() => getInitialClearAfterState(user.statusExpiresAt), []);
	const [clearAfter, setClearAfter] = useState<ClearAfterValue>(initialClearAfterState.value);
	const [clearAfterDate, setClearAfterDate] = useState<Date | null>(initialClearAfterState.customDate);
	const clearAfterTouched = useRef(false);

	const dispatch = useDispatch();
	const { setOptions, goBack } = useNavigation();
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	const submit = async () => {
		const { status } = inputValues;
		logEvent(events.STATUS_DONE);
		if (statusText !== user.statusText || status !== user.status || clearAfterTouched.current) {
			const expiresAt =
				clearAfterTouched.current && supportsStatusExpiry ? computeExpiresAt(clearAfter, clearAfterDate) : undefined;
			await setCustomStatus(status, statusText, expiresAt);
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
		setValue('statusText', statusText);
	};

	const setCustomStatus = async (status: TUserStatus, statusText: string, expiresAt?: string | null) => {
		sendLoadingEvent({ visible: true });
		try {
			await setUserStatus(status, statusText, expiresAt);
			dispatch(
				setUser({
					statusText,
					status,
					...(expiresAt !== undefined && { statusExpiresAt: expiresAt ?? undefined })
				})
			);
			logEvent(events.STATUS_CUSTOM);
			showToast(I18n.t('Status_saved_successfully'));
		} catch (e: any) {
			logEvent(events.STATUS_CUSTOM_F);
			showErrorAlertWithEMessage(e);
			log(e);
		}
		sendLoadingEvent({ visible: false });
	};

	const statusOptions = useMemo(() => {
		const statuses = STATUS.filter(s => {
			if (s._id === 'offline' && !Accounts_AllowInvisibleStatusOption) return false;
			return true;
		});
		return [...statuses, ...customUserStatus.map(s => ({ _id: s._id, name: s.name, statusType: s.statusType, isCustom: true }))];
	}, [Accounts_AllowInvisibleStatusOption, customUserStatus]);

	const isStatusChanged = () => {
		const { status } = inputValues;
		if (!isValid) {
			return true;
		}
		if (supportsStatusExpiry && clearAfterTouched.current) {
			return false;
		}
		const isStatusEqual = status === user.status;
		const isStatusTextEqual = (!!user.statusText && user.statusText === statusText) || (!user.statusText && !statusText);
		return isStatusEqual && isStatusTextEqual;
	};

	const handleClearAfterChange = (value: ClearAfterValue, date: Date | null) => {
		clearAfterTouched.current = true;
		setClearAfter(value);
		if (date) setClearAfterDate(date);
	};

	return (
		<SafeAreaView testID='status-view'>
			<FlatList
				data={statusOptions}
				keyExtractor={item => item._id}
				renderItem={({ item }) => (
					<Status
						option={item}
						statusText={inputValues.statusText}
						status={inputValues.status}
						setStatus={setStatus}
						isCustom={item.isCustom}
					/>
				)}
				ListHeaderComponent={
					<>
						<ControlledFormTextInput
							name='statusText'
							control={control}
							label={I18n.t('Status')}
							value={statusText}
							containerStyle={styles.inputContainer}
							inputStyle={styles.inputStyle}
							testID='status-view-input'
							error={errors.statusText?.message}
						/>
						<List.Separator />
					</>
				}
				ListFooterComponent={
					<FooterComponent
						supportsStatusExpiry={supportsStatusExpiry}
						clearAfter={clearAfter}
						clearAfterDate={clearAfterDate}
						onClearAfterChange={handleClearAfterChange}
						disabled={isStatusChanged()}
						onSubmit={submit}
					/>
				}
				style={{ backgroundColor: colors.surfaceTint }}
				contentContainerStyle={{ paddingBottom: bottom }}
			/>
		</SafeAreaView>
	);
};

export default StatusView;
