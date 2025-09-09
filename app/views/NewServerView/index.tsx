import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, BackHandler, Keyboard, Text } from 'react-native';
import { useDispatch } from 'react-redux';
import { Image } from 'expo-image';
import { useForm } from 'react-hook-form';

import { inviteLinksClear } from '../../actions/inviteLinks';
import { selectServerRequest, serverFinishAdd, serverRequest } from '../../actions/server';
import Button from '../../containers/Button';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import { TServerHistoryModel } from '../../definitions';
import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { isAndroid, isTablet } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import ServerInput from './components/ServerInput';
import { getServerById } from '../../lib/database/services/Server';
import { useAppSelector } from '../../lib/hooks';
import useServersHistory from './hooks/useServersHistory';
import useCertificate from './hooks/useCertificate';
import CertificatePicker from './components/CertificatePicker';
import useConnectServer from './hooks/useConnectServer';
import { INewServerViewProps } from './definitions';
import completeUrl from './utils/completeUrl';
import styles from './styles';

const NewServerView = ({ navigation }: INewServerViewProps) => {
	const dispatch = useDispatch();
	const { colors } = useTheme();
	const { previousServer, connecting, failureMessage } = useAppSelector(state => ({
		previousServer: state.server.previousServer,
		connecting: state.server.connecting,
		failureMessage: state.server.failureMessage
	}));

	const {
		control,
		watch,
		formState: { errors },
		setValue,
		setError,
		clearErrors
	} = useForm({ mode: 'onChange', defaultValues: { workspaceUrl: '' } });

	const workspaceUrl = watch('workspaceUrl');
	const [showBottomInfo, setShowBottomInfo] = useState<boolean>(true);
	const { deleteServerHistory, queryServerHistory, serversHistory } = useServersHistory();
	const { certificate, chooseCertificate, removeCertificate, autocompleteCertificate } = useCertificate();
	const { submit } = useConnectServer({ workspaceUrl, certificate, previousServer });
	const phoneMarginTop = previousServer ? 32 : 84;
	const marginTop = isTablet ? 0 : phoneMarginTop;
	const formContainerStyle = previousServer ? { paddingBottom: 100 } : {};

	const onChangeText = (text: string) => {
		setValue('workspaceUrl', text);
		queryServerHistory(text);
		clearErrors();
		autocompleteCertificate(completeUrl(text));
	};

	const onPressServerHistory = (serverHistory: TServerHistoryModel) => {
		setValue('workspaceUrl', serverHistory.url);
		autocompleteCertificate(serverHistory.url);
		submit({ fromServerHistory: true, username: serverHistory?.username, serverUrl: serverHistory?.url });
	};

	const handleBackPress = () => {
		if (navigation.isFocused() && previousServer) {
			close();
			return true;
		}
		return false;
	};

	const handleNewServerEvent = (event: { server: string }) => {
		let { server } = event;
		if (!server) {
			return;
		}
		setValue('workspaceUrl', server);
		server = completeUrl(server);
		dispatch(serverRequest(server));
	};

	const close = async () => {
		dispatch(inviteLinksClear());
		if (previousServer) {
			const serverRecord = await getServerById(previousServer);
			if (serverRecord) {
				dispatch(selectServerRequest(previousServer, serverRecord.version));
			}
		}
	};

	const setHeader = () => {
		if (previousServer) {
			return navigation.setOptions({
				headerTitle: I18n.t('Add_Server'),
				headerLeft: () =>
					!connecting ? <HeaderButton.CloseModal navigation={navigation} onPress={close} testID='new-server-view-close' /> : null
			});
		}
		return navigation.setOptions({
			headerShown: false
		});
	};

	useEffect(() => {
		if (failureMessage && !errors.workspaceUrl) {
			AccessibilityInfo.announceForAccessibility(failureMessage);
			setError('workspaceUrl', { message: failureMessage });
		}
	}, [failureMessage]);

	useEffect(() => {
		EventEmitter.addEventListener('NewServer', handleNewServerEvent);
		const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

		let keyboardShowListener: ReturnType<typeof Keyboard.addListener> | null = null;
		let keyboardHideListener: ReturnType<typeof Keyboard.addListener> | null = null;

		if (isAndroid) {
			keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => setShowBottomInfo(false));
			keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => setShowBottomInfo(true));
		}

		return () => {
			EventEmitter.removeListener('NewServer', handleNewServerEvent);
			backHandler.remove();

			if (isAndroid) {
				keyboardShowListener?.remove();
				keyboardHideListener?.remove();
			}

			if (previousServer) {
				dispatch(serverFinishAdd());
			}
		};
	}, []);

	useEffect(() => {
		setHeader();
	}, [connecting, previousServer]);

	return (
		<FormContainer
			style={formContainerStyle}
			showAppVersion={showBottomInfo}
			testID='new-server-view'
			keyboardShouldPersistTaps='handled'>
			<FormContainerInner accessibilityLabel={I18n.t('Add_server')}>
				<Image
					style={{
						...styles.onboardingImage,
						marginTop
					}}
					source={require('../../static/images/logo_with_name.png')}
					contentFit='contain'
				/>
				<Text
					style={{
						...styles.title,
						color: colors.fontTitlesLabels
					}}>
					{I18n.t('Add_server')}
				</Text>
				<ServerInput
					error={errors.workspaceUrl?.message}
					control={control}
					serversHistory={serversHistory}
					onChangeText={onChangeText}
					onSubmit={submit}
					onDelete={deleteServerHistory}
					onPressServerHistory={onPressServerHistory}
				/>
				<Button
					title={I18n.t('Connect')}
					type='primary'
					onPress={submit}
					disabled={!workspaceUrl || connecting}
					loading={connecting}
					style={styles.connectButton}
					testID='new-server-view-button'
				/>
			</FormContainerInner>
			<CertificatePicker
				certificate={certificate}
				chooseCertificate={() => chooseCertificate(completeUrl(workspaceUrl))}
				connecting={connecting}
				handleRemove={() => removeCertificate(completeUrl(workspaceUrl))}
				previousServer={previousServer}
				showBottomInfo
			/>
		</FormContainer>
	);
};

export default NewServerView;
