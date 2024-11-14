import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
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
		name: 'Invisible'
	}
];

const styles = StyleSheet.create({
	inputContainer: {
		marginTop: 16,
		marginBottom: 16
	},
	inputLeft: {
		position: 'absolute',
		left: 12
	},
	inputStyle: {
		paddingLeft: 48,
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
		<List.Item
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
		/>
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

	useEffect(() => {
		const submit = async () => {
			logEvent(events.STATUS_DONE);
			if (statusText !== user.statusText || status !== user.status) {
				await setCustomStatus(status, statusText);
			}
			goBack();
		};
		const setHeader = () => {
			setOptions({
				title: I18n.t('Edit_Status'),
				headerLeft: isMasterDetail ? undefined : () => <HeaderButton.CancelModal onPress={goBack} />,
				headerRight: () => (
					<HeaderButton.Container>
						<HeaderButton.Item
							title={I18n.t('Save')}
							onPress={submit}
							disabled={status === user.status && statusText === user.statusText}
							testID='status-view-submit'
						/>
					</HeaderButton.Container>
				)
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

	return (
		<SafeAreaView testID='status-view'>
			<FlatList
				data={statusType}
				keyExtractor={item => item.id}
				renderItem={({ item }) => <Status statusType={item} status={status} setStatus={setStatus} />}
				ListHeaderComponent={
					<>
						<FormTextInput
							value={statusText}
							containerStyle={styles.inputContainer}
							onChangeText={text => setStatusText(text)}
							left={
								<StatusIcon
									accessible={false}
									testID={`status-view-current-${status}`}
									style={styles.inputLeft}
									status={status}
									size={24}
								/>
							}
							inputStyle={styles.inputStyle}
							placeholder={I18n.t('What_are_you_doing_right_now')}
							testID='status-view-input'
						/>
						<List.Separator />
					</>
				}
				ListFooterComponent={List.Separator}
				ItemSeparatorComponent={List.Separator}
				style={{ backgroundColor: colors.surfaceTint }}
			/>
		</SafeAreaView>
	);
};

export default StatusView;
