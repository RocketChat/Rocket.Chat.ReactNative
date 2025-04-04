import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, Text } from 'react-native';
import { useDispatch } from 'react-redux';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { TServerHistoryModel } from '../../definitions';
import { inviteLinksClear } from '../../actions/inviteLinks';
import { selectServerRequest, serverFinishAdd, serverRequest } from '../../actions/server';
import Button from '../../containers/Button';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import OrSeparator from '../../containers/OrSeparator';
import { themes } from '../../lib/constants';
import { isIOS, isTablet } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { useAppSelector } from '../../lib/hooks';
import CertificatePicker from './components/CertificatePicker';
import ServerInput from './components/ServerInput';
import useServersHistory from './hooks/useServersHistory';
import useCertificate from './hooks/useCertificate';
import useConnectServer from './hooks/useConnectServer';
import completeUrl from './utils/completeUrl';
import { INewServerViewProps } from './definitions';
import styles from './styles';
import { getServerById } from '../../lib/database/services/Server';

const NewServerView = ({ navigation }: INewServerViewProps) => {
	const dispatch = useDispatch();
	const { theme } = useTheme();
	const { previousServer, connecting } = useAppSelector(state => ({
		previousServer: state.server.previousServer,
		connecting: state.server.connecting
	}));

	const [text, setText] = useState<string>('');
	const { deleteServerHistory, queryServerHistory, serversHistory } = useServersHistory();
	const { certificate, chooseCertificate, removeCertificate } = useCertificate();
	const { connectOpen, connectingOpen, submit } = useConnectServer({ text, certificate });
	const marginTop = previousServer ? 0 : 35;

	const onChangeText = (text: string) => {
		setText(text);
		queryServerHistory(text);
	};

	const setHeader = () => {
		if (previousServer) {
			return navigation.setOptions({
				headerTitle: I18n.t('Add_server'),
				headerLeft: () =>
					!connecting ? <HeaderButton.CloseModal navigation={navigation} onPress={close} testID='new-server-view-close' /> : null
			});
		}

		return navigation.setOptions({
			headerShown: false
		});
	};

	const handleBackPress = () => {
		if (navigation.isFocused() && previousServer) {
			close();
			return true;
		}
		return false;
	};

	const onPressServerHistory = (serverHistory: TServerHistoryModel) => {
		setText(serverHistory.url);
		submit({ fromServerHistory: true, username: serverHistory?.username, serverUrl: serverHistory?.url });
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

	const handleNewServerEvent = useCallback((event: { server: string }) => {
		let { server } = event;
		if (!server) {
			return;
		}
		setText(server);
		server = completeUrl(server);
		dispatch(serverRequest(server));
	}, []);

	useEffect(() => {
		EventEmitter.addEventListener('NewServer', handleNewServerEvent);
		BackHandler.addEventListener('hardwareBackPress', handleBackPress);

		return () => {
			EventEmitter.removeListener('NewServer', handleNewServerEvent);
			BackHandler.removeEventListener('hardwareBackPress', handleBackPress);

			if (previousServer) {
				dispatch(serverFinishAdd());
			}
		};
	}, []);

	useEffect(() => {
		setHeader();
	}, [connecting]);

	return (
		<FormContainer testID='new-server-view' keyboardShouldPersistTaps='never'>
			<FormContainerInner>
				<Image
					style={[
						styles.onboardingImage,
						{
							marginBottom: 10,
							marginTop: isTablet ? 0 : marginTop,
							width: 100,
							height: 100
						}
					]}
					source={require('../../static/images/logo.png')}
					fadeDuration={0}
				/>
				<Text
					style={[
						styles.title,
						{
							color: themes[theme].fontTitlesLabels,
							fontSize: 22,
							marginBottom: 8
						}
					]}>
					Rocket.Chat
				</Text>
				<Text
					style={[
						styles.subtitle,
						{
							color: themes[theme].fontHint,
							fontSize: 16,
							marginBottom: 30
						}
					]}>
					{I18n.t('Onboarding_subtitle')}
				</Text>
				<ServerInput
					text={text}
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
					disabled={!text || connecting}
					loading={!connectingOpen && connecting}
					style={[styles.connectButton, { marginTop: 16 }]}
					testID='new-server-view-button'
				/>
				{isIOS ? (
					<>
						<OrSeparator theme={theme} />
						<Text
							style={[
								styles.description,
								{
									color: themes[theme].fontSecondaryInfo,
									fontSize: 14,
									marginBottom: 16
								}
							]}>
							{I18n.t('Onboarding_join_open_description')}
						</Text>
						<Button
							title={I18n.t('Join_our_open_workspace')}
							type='secondary'
							onPress={connectOpen}
							disabled={connecting}
							loading={connectingOpen && connecting}
							testID='new-server-view-open'
						/>
					</>
				) : null}
			</FormContainerInner>
			<CertificatePicker
				certificate={certificate}
				chooseCertificate={chooseCertificate}
				handleRemove={removeCertificate}
				previousServer={previousServer}
				theme={theme}
			/>
		</FormContainer>
	);
};

export default NewServerView;
