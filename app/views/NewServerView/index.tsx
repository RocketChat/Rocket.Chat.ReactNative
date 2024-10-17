import React, { useEffect, useLayoutEffect, useState } from 'react';
import { BackHandler, Image, Keyboard, Text } from 'react-native';
import parse from 'url-parse';
import { Base64 } from 'js-base64';
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
import { CERTIFICATE_KEY, themes } from '../../lib/constants';
import UserPreferences from '../../lib/methods/userPreferences';
import { isIOS, isTablet } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { BASIC_AUTH_KEY, setBasicAuth } from '../../lib/methods/helpers/fetch';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { serializeAsciiUrl } from '../../lib/methods';
import { useAppSelector } from '../../lib/hooks';
import CertificatePicker from './components/CertificatePicker';
import ServerInput from './components/ServerInput';
import useServersHistory from './hooks/useServersHistory';
import useCertificate from './hooks/useCertificate';
import { INewServerViewProps, TSubmitParams } from './types';
import styles from './styles';

const NewServerView = ({ navigation }: INewServerViewProps) => {
	const dispatch = useDispatch();
	const { theme } = useTheme();
	const { previousServer, connecting } = useAppSelector(state => ({
		previousServer: state.server.previousServer,
		connecting: state.server.connecting
	}));

	const [text, setText] = useState<string>('');
	const [connectingOpen, setConnectingOpen] = useState(false);
	const { deleteServerHistory, queryServerHistory, serversHistory } = useServersHistory();
	const { certificate, chooseCertificate, removeCertificate } = useCertificate();

	const marginTop = previousServer ? 0 : 35;

	const setHeader = () => {
		if (previousServer) {
			return navigation.setOptions({
				headerTitle: I18n.t('Workspaces'),
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

	const onChangeText = (text: string) => {
		setText(text);
		queryServerHistory(text);
	};

	const onPressServerHistory = (serverHistory: TServerHistoryModel) => {
		setText(serverHistory.url);
		submit({ fromServerHistory: true, username: serverHistory?.username, serverUrl: serverHistory?.url });
	};

	const basicAuth = (server: string, text: string) => {
		try {
			const parsedUrl = parse(text, true);
			if (parsedUrl.auth.length) {
				const credentials = Base64.encode(parsedUrl.auth);
				UserPreferences.setString(`${BASIC_AUTH_KEY}-${server}`, credentials);
				setBasicAuth(credentials);
			}
		} catch {
			// do nothing
		}
	};

	const completeUrl = (url: string) => {
		const parsedUrl = parse(url, true);
		if (parsedUrl.auth.length) {
			url = parsedUrl.origin;
		}

		url = url && url.replace(/\s/g, '');

		if (/^(\w|[0-9-_]){3,}$/.test(url) && /^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
			url = `${url}.rocket.chat`;
		}

		if (/^(https?:\/\/)?(((\w|[0-9-_])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
			if (/^localhost(:\d+)?/.test(url)) {
				url = `http://${url}`;
			} else if (/^https?:\/\//.test(url) === false) {
				url = `https://${url}`;
			}
		}
		return serializeAsciiUrl(url.replace(/\/+$/, '').replace(/\\/g, '/'));
	};

	const submit = ({ fromServerHistory = false, username, serverUrl }: TSubmitParams = {}) => {
		logEvent(events.NS_CONNECT_TO_WORKSPACE);

		setConnectingOpen(false);
		if (text || serverUrl) {
			Keyboard.dismiss();
			const server = completeUrl(serverUrl ?? text);

			// Save info - SSL Pinning
			if (certificate) {
				UserPreferences.setString(`${CERTIFICATE_KEY}-${server}`, certificate);
			}

			// Save info - HTTP Basic Authentication
			basicAuth(server, serverUrl ?? text);

			if (fromServerHistory) {
				dispatch(serverRequest(server, username, true));
			} else {
				dispatch(serverRequest(server));
			}
		}
	};

	const connectOpen = () => {
		logEvent(events.NS_JOIN_OPEN_WORKSPACE);
		setConnectingOpen(true);
		dispatch(serverRequest('https://open.rocket.chat'));
	};

	const close = () => {
		dispatch(inviteLinksClear());
		if (previousServer) {
			dispatch(selectServerRequest(previousServer));
		}
	};

	const handleNewServerEvent = (event: { server: string }) => {
		let { server } = event;
		if (!server) {
			return;
		}
		setText(server);
		server = completeUrl(server);
		dispatch(serverRequest(server));
	};

	useLayoutEffect(() => {
		EventEmitter.addEventListener('NewServer', handleNewServerEvent);
		BackHandler.addEventListener('hardwareBackPress', handleBackPress);
		queryServerHistory();

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
					theme={theme}
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
