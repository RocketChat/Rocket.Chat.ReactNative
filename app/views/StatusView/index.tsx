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

const validationSchema = yup.object({
	statusText: yup
		.string()
		.max(USER_STATUS_TEXT_MAX_LENGTH, I18n.t('Status_text_limit_exceeded', { limit: USER_STATUS_TEXT_MAX_LENGTH }))
});

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

const StatusView = (): ReactElement => {
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const isMasterDetail = useMasterDetail();
	const Accounts_AllowInvisibleStatusOption = useSelector(
		(state: IApplicationState) => state.settings.Accounts_AllowInvisibleStatusOption
	);
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

	const setStatus = (updatedStatus: TUserStatus) => {
		setValue('status', updatedStatus);
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

	const statusType = STATUS.filter(s => {
		if (s.id === 'offline' && !Accounts_AllowInvisibleStatusOption) return false;
		return true;
	});

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
				data={statusType}
				keyExtractor={item => item.id}
				renderItem={({ item }) => <Status statusType={item} status={inputValues.status} setStatus={setStatus} />}
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
