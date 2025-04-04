import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { setUser } from '../../actions/login';
import * as HeaderButton from '../../containers/HeaderButton';
import * as List from '../../containers/List';
import { sendLoadingEvent } from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusIcon from '../../containers/Status/Status';
import { FormTextInput } from '../../containers/TextInput';
import { IApplicationState, TUserStatus } from '../../definitions';
import I18n from '../../i18n';
import { showToast } from '../../lib/methods/helpers/showToast';
import { Services } from '../../lib/services';
import { getUserSelector } from '../../selectors/login';
import { showErrorAlert } from '../../lib/methods/helpers';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { useTheme } from '../../theme';
import Button from '../../containers/Button';
import Check from '../../containers/Check';

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
			<List.Item
				additionalAcessibilityLabel={`${status === id ? I18n.t('Current_Status') : ''}`}
				title={name}
				onPress={() => {
					const key = `STATUS_${statusType.id.toUpperCase()}` as keyof typeof events;
					logEvent(events[key]);
					if (status !== statusType.id) {
						setStatus(statusType.id);
					}
				}}
				testID={`status-view-${id}`}
				left={() => <StatusIcon size={24} status={statusType.id} />}
				right={() => (status === id ? <Check /> : null)}
			/>
			<List.Separator />
		</>
	);
};

const StatusView = (): React.ReactElement => {
	const user = useSelector((state: IApplicationState) => getUserSelector(state));
	const isMasterDetail = useSelector((state: IApplicationState) => state.app.isMasterDetail);
	const Accounts_AllowInvisibleStatusOption = useSelector(
		(state: IApplicationState) => state.settings.Accounts_AllowInvisibleStatusOption
	);

	const [statusText, setStatusText] = useState(user.statusText || '');
	const [status, setStatus] = useState(user.status);

	const dispatch = useDispatch();
	const { setOptions, goBack } = useNavigation();
	const { colors } = useTheme();

	const submit = async () => {
		logEvent(events.STATUS_DONE);
		if (statusText !== user.statusText || status !== user.status) {
			await setCustomStatus(status, statusText);
		}
		goBack();
	};

	useEffect(() => {
		const setHeader = () => {
			setOptions({
				title: I18n.t('Edit_Status'),
				headerLeft: isMasterDetail ? undefined : () => <HeaderButton.CloseModal onPress={goBack} />
			});
		};
		setHeader();
	}, [statusText, status]);

	const setCustomStatus = async (status: TUserStatus, statusText: string) => {
		sendLoadingEvent({ visible: true });
		try {
			await Services.setUserStatus(status, statusText);
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

	const statusType = Accounts_AllowInvisibleStatusOption ? STATUS : STATUS.filter(s => s.id !== 'offline');

	const isStatusMatching = () => {
		const isStatusEqual = status === user.status;
		const isStatusTextEqual = (!!user.statusText && user.statusText === statusText) || (!user.statusText && !statusText);

		return isStatusEqual && isStatusTextEqual;
	};

	const FooterComponent = () => (
		<View style={styles.footerComponent}>
			<Button testID='status-view-submit' disabled={isStatusMatching()} onPress={submit} title={I18n.t('Save')} />
		</View>
	);

	return (
		<SafeAreaView testID='status-view'>
			<FlatList
				data={statusType}
				keyExtractor={item => item.id}
				renderItem={({ item }) => <Status statusType={item} status={status} setStatus={setStatus} />}
				ListHeaderComponent={
					<>
						<FormTextInput
							label={I18n.t('Message')}
							value={statusText}
							containerStyle={styles.inputContainer}
							onChangeText={text => setStatusText(text)}
							inputStyle={styles.inputStyle}
							testID='status-view-input'
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
