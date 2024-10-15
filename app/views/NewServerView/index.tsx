import { Q } from '@nozbe/watermelondb';
import { Base64 } from 'js-base64';
import React, { useEffect, useLayoutEffect, useReducer } from 'react';
import { BackHandler, Image, Keyboard, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import parse from 'url-parse';

import { inviteLinksClear } from '../../actions/inviteLinks';
import { selectServerRequest, serverFinishAdd, serverRequest } from '../../actions/server';
import { CERTIFICATE_KEY, themes } from '../../lib/constants';
import Button from '../../containers/Button';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import OrSeparator from '../../containers/OrSeparator';
import { IApplicationState, TServerHistoryModel } from '../../definitions';
import I18n from '../../i18n';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import UserPreferences from '../../lib/methods/userPreferences';
import { withTheme } from '../../theme';
import { isAndroid, isIOS, isTablet } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { BASIC_AUTH_KEY, setBasicAuth } from '../../lib/methods/helpers/fetch';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import { events, logEvent } from '../../lib/methods/helpers/log';
import SSLPinning from '../../lib/methods/helpers/sslPinning';
import sharedStyles from '../Styles';
import ServerInput from './ServerInput';
import { serializeAsciiUrl } from '../../lib/methods';
import { INewServerViewProps, ISubmitParams } from './types';
import { newServerReducer, newServerInitialState } from './reducer';

const styles = StyleSheet.create({
	onboardingImage: {
		alignSelf: 'center',
		resizeMode: 'contain'
	},
	title: {
		...sharedStyles.textBold,
		letterSpacing: 0,
		alignSelf: 'center'
	},
	subtitle: {
		...sharedStyles.textRegular,
		alignSelf: 'center'
	},
	certificatePicker: {
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	chooseCertificateTitle: {
		...sharedStyles.textRegular
	},
	chooseCertificate: {
		...sharedStyles.textSemibold
	},
	description: {
		...sharedStyles.textRegular,
		textAlign: 'center'
	},
	connectButton: {
		marginBottom: 0
	}
});

const NewServerView = ({ connecting, dispatch, navigation, previousServer, theme }: INewServerViewProps) => {
	const [state, reducerDispatch] = useReducer(newServerReducer, newServerInitialState);

	const setText = (value: string) => reducerDispatch({ type: 'SET_TEXT', payload: value });
	const setConnectingOpen = (value: boolean) => reducerDispatch({ type: 'SET_CONNECTING_OPEN', payload: value });
	const setCertificate = (value: string | null) => reducerDispatch({ type: 'SET_CERTIFICATE', payload: value });
	const setServersHistory = (value: TServerHistoryModel[]) => reducerDispatch({ type: 'SET_SERVERS_HISTORY', payload: value });
	const deleteServerFromHistory = (value: string) => reducerDispatch({ type: 'DELETE_SERVER_FROM_HISTORY', payload: value });

	const { certificate, connectingOpen, serversHistory, text } = state;

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

	const queryServerHistory = async (text?: string) => {
		const db = database.servers;
		try {
			const serversHistoryCollection = db.get('servers_history');
			let whereClause = [Q.where('username', Q.notEq(null)), Q.sortBy('updated_at', Q.desc), Q.take(3)];
			if (text) {
				const likeString = sanitizeLikeString(text);
				whereClause = [...whereClause, Q.where('url', Q.like(`%${likeString}%`))];
			}
			const serversHistory = await serversHistoryCollection.query(...whereClause).fetch();

			setServersHistory(serversHistory);
		} catch {
			// Do nothing
		}
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

	const onPressServerHistory = (serverHistory: TServerHistoryModel) => {
		setText(serverHistory.url);
		submit({ fromServerHistory: true, username: serverHistory?.username, serverUrl: serverHistory?.url });
	};

	const submit = ({ fromServerHistory = false, username, serverUrl }: ISubmitParams = {}) => {
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

	const chooseCertificate = async () => {
		try {
			const certificate = await SSLPinning?.pickCertificate();
			setCertificate(certificate);
		} catch {
			// Do nothing
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

	const handleRemove = () => {
		showConfirmationAlert({
			message: I18n.t('You_will_unset_a_certificate_for_this_server'),
			confirmationText: I18n.t('Remove'),
			onPress: () => setCertificate(null) // We not need delete file from DocumentPicker because it is a temp file
		});
	};

	const deleteServerHistory = async (item: TServerHistoryModel) => {
		const db = database.servers;
		try {
			await db.write(async () => {
				await item.destroyPermanently();
			});
			deleteServerFromHistory(item?.id);
		} catch {
			// Nothing
		}
	};

	const renderCertificatePicker = () => (
		<View
			style={[
				styles.certificatePicker,
				{
					marginTop: isAndroid ? 20 : 0,
					marginBottom: previousServer && !isTablet ? 10 : 30
				}
			]}>
			<Text style={[styles.chooseCertificateTitle, { color: themes[theme].fontSecondaryInfo, fontSize: 13 }]}>
				{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
			</Text>
			<TouchableOpacity onPress={certificate ? handleRemove : chooseCertificate} testID='new-server-choose-certificate'>
				<Text style={[styles.chooseCertificate, { color: themes[theme].fontInfo, fontSize: 13 }]}>
					{certificate ?? I18n.t('Apply_Your_Certificate')}
				</Text>
			</TouchableOpacity>
		</View>
	);

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
			{renderCertificatePicker()}
		</FormContainer>
	);
};

const mapStateToProps = (state: IApplicationState) => ({
	connecting: state.server.connecting,
	previousServer: state.server.previousServer
});

export default connect(mapStateToProps)(withTheme(NewServerView));
