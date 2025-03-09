import { Q } from '@nozbe/watermelondb';
import { Base64 } from 'js-base64';
import React from 'react';
import { BackHandler, Keyboard, StyleSheet, Text } from 'react-native';
import { connect } from 'react-redux';
import parse from 'url-parse';
import { Image } from 'expo-image';

import { inviteLinksClear } from '../../actions/inviteLinks';
import { selectServerRequest, serverFinishAdd, serverRequest } from '../../actions/server';
import { CERTIFICATE_KEY, themes } from '../../lib/constants';
import Button from '../../containers/Button';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import { IApplicationState, IBaseScreen, TServerHistoryModel } from '../../definitions';
import I18n from '../../i18n';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import UserPreferences from '../../lib/methods/userPreferences';
import { OutsideParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import { isAndroid, isTablet } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { BASIC_AUTH_KEY, setBasicAuth } from '../../lib/methods/helpers/fetch';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import { events, logEvent } from '../../lib/methods/helpers/log';
import SSLPinning from '../../lib/methods/helpers/sslPinning';
import sharedStyles from '../Styles';
import ServerInput from './ServerInput';
import { serializeAsciiUrl } from '../../lib/methods';
import { getServerById } from '../../lib/database/services/Server';

const styles = StyleSheet.create({
	onboardingImage: {
		alignSelf: 'center'
	},
	buttonPrompt: {
		...sharedStyles.textRegular,
		textAlign: 'center',
		lineHeight: 20
	},
	connectButton: {
		marginTop: 36
	}
});

interface INewServerViewProps extends IBaseScreen<OutsideParamList, 'NewServerView'> {
	connecting: boolean;
	previousServer: string | null;
}

interface INewServerViewState {
	text: string;
	certificate: string | null;
	serversHistory: TServerHistoryModel[];
	showBottomInfo: boolean;
}

interface ISubmitParams {
	fromServerHistory?: boolean;
	username?: string;
}

class NewServerView extends React.Component<INewServerViewProps, INewServerViewState> {
	constructor(props: INewServerViewProps) {
		super(props);
		this.setHeader();

		this.state = {
			text: '',
			certificate: null,
			serversHistory: [],
			showBottomInfo: true
		};
		EventEmitter.addEventListener('NewServer', this.handleNewServerEvent);
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		if (isAndroid) {
			Keyboard.addListener('keyboardDidShow', () => this.handleShowKeyboard());
			Keyboard.addListener('keyboardDidHide', () => this.handleHideKeyboard());
		}
	}

	componentDidMount() {
		this.queryServerHistory();
	}

	componentWillUnmount() {
		EventEmitter.removeListener('NewServer', this.handleNewServerEvent);
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
		if (isAndroid) {
			Keyboard.removeAllListeners('keyboardDidShow');
			Keyboard.removeAllListeners('keyboardDidHide');
		}

		const { previousServer, dispatch } = this.props;
		if (previousServer) {
			dispatch(serverFinishAdd());
		}
	}

	componentDidUpdate(prevProps: Readonly<INewServerViewProps>) {
		if (prevProps.connecting !== this.props.connecting) {
			this.setHeader();
		}
	}

	setHeader = () => {
		const { previousServer, navigation, connecting } = this.props;
		if (previousServer) {
			return navigation.setOptions({
				headerTitle: I18n.t('Add_server'),
				headerLeft: () =>
					!connecting ? (
						<HeaderButton.CloseModal navigation={navigation} onPress={this.close} testID='new-server-view-close' />
					) : null
			});
		}

		return navigation.setOptions({
			headerShown: false
		});
	};

	handleBackPress = () => {
		const { navigation, previousServer } = this.props;
		if (navigation.isFocused() && previousServer) {
			this.close();
			return true;
		}
		return false;
	};

	handleShowKeyboard = () => {
		this.setState({ ...this.state, showBottomInfo: false });
	};

	handleHideKeyboard = () => {
		this.setState({ ...this.state, showBottomInfo: true });
	};

	onChangeText = (text: string) => {
		this.setState({ text });
		this.queryServerHistory(text);
	};

	queryServerHistory = async (text?: string) => {
		const db = database.servers;
		try {
			const serversHistoryCollection = db.get('servers_history');
			let whereClause = [Q.where('username', Q.notEq(null)), Q.sortBy('updated_at', Q.desc), Q.take(3)];
			if (text) {
				const likeString = sanitizeLikeString(text);
				whereClause = [...whereClause, Q.where('url', Q.like(`%${likeString}%`))];
			}
			const serversHistory = await serversHistoryCollection.query(...whereClause).fetch();
			this.setState({ serversHistory });
		} catch {
			// Do nothing
		}
	};

	close = async () => {
		const { dispatch, previousServer } = this.props;

		dispatch(inviteLinksClear());
		if (previousServer) {
			const serverRecord = await getServerById(previousServer);
			if (serverRecord) {
				dispatch(selectServerRequest(previousServer, serverRecord.version));
			}
		}
	};

	handleNewServerEvent = (event: { server: string }) => {
		let { server } = event;
		if (!server) {
			return;
		}
		const { dispatch } = this.props;
		this.setState({ text: server });
		server = this.completeUrl(server);
		dispatch(serverRequest(server));
	};

	onPressServerHistory = (serverHistory: TServerHistoryModel) => {
		this.setState({ text: serverHistory.url }, () => this.submit({ fromServerHistory: true, username: serverHistory?.username }));
	};

	submit = ({ fromServerHistory = false, username }: ISubmitParams = {}) => {
		logEvent(events.NS_CONNECT_TO_WORKSPACE);
		const { text, certificate } = this.state;
		const { dispatch } = this.props;

		if (text) {
			Keyboard.dismiss();
			const server = this.completeUrl(text);

			// Save info - SSL Pinning
			if (certificate) {
				UserPreferences.setString(`${CERTIFICATE_KEY}-${server}`, certificate);
			}

			// Save info - HTTP Basic Authentication
			this.basicAuth(server, text);

			if (fromServerHistory) {
				dispatch(serverRequest(server, username, true));
			} else {
				dispatch(serverRequest(server));
			}
		}
	};

	basicAuth = (server: string, text: string) => {
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

	chooseCertificate = async () => {
		try {
			const certificate = await SSLPinning?.pickCertificate();
			this.setState({ certificate });
		} catch {
			// Do nothing
		}
	};

	completeUrl = (url: string) => {
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

	uriToPath = (uri: string) => uri.replace('file://', '');

	handleRemove = () => {
		showConfirmationAlert({
			message: I18n.t('You_will_unset_a_certificate_for_this_server'),
			confirmationText: I18n.t('Remove'),
			onPress: () => this.setState({ certificate: null }) // We not need delete file from DocumentPicker because it is a temp file
		});
	};

	deleteServerHistory = async (item: TServerHistoryModel) => {
		const db = database.servers;
		try {
			await db.write(async () => {
				await item.destroyPermanently();
			});
			this.setState((prevstate: INewServerViewState) => ({
				serversHistory: prevstate.serversHistory.filter(server => server.id !== item.id)
			}));
		} catch {
			// Nothing
		}
	};

	renderCertificatePicker = () => {
		const { certificate, showBottomInfo } = this.state;
		const { theme, connecting } = this.props;

		if (!showBottomInfo) return <></>;

		return (
			<>
				<Text style={[styles.buttonPrompt, { color: themes[theme].fontSecondaryInfo }]}>
					{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
				</Text>
				<Button
					onPress={certificate ? this.handleRemove : this.chooseCertificate}
					testID='new-server-choose-certificate'
					title={certificate ?? I18n.t('Apply_Certificate')}
					type='secondary'
					disabled={connecting}
					style={{ marginTop: 12, marginBottom: 24 }}
					fontSize={12}
					styleText={{ ...sharedStyles.textBold, textAlign: 'center' }}
					small
				/>
			</>
		);
	};

	render() {
		const { connecting, theme, previousServer } = this.props;
		const { text, serversHistory, showBottomInfo } = this.state;
		const marginTop = previousServer ? 32 : 84;
		const formContainerStyle = previousServer ? { paddingBottom: 100 } : {};
		return (
			<FormContainer
				style={formContainerStyle}
				showAppVersion={showBottomInfo}
				testID='new-server-view'
				keyboardShouldPersistTaps='handled'>
				<FormContainerInner accessibilityLabel={I18n.t('Add_server')}>
					<Image
						style={[
							styles.onboardingImage,
							{
								marginBottom: 32,
								marginTop: isTablet ? 0 : marginTop,
								width: 250,
								height: 50
							}
						]}
						source={require('../../static/images/logo_with_name.png')}
						contentFit='contain'
					/>
					<Text
						style={{
							fontSize: 24,
							lineHeight: 36,
							marginBottom: 24,
							color: themes[theme].fontTitlesLabels,
							...sharedStyles.textBold
						}}>
						{I18n.t('Add_server')}
					</Text>
					<ServerInput
						text={text}
						serversHistory={serversHistory}
						onChangeText={this.onChangeText}
						onSubmit={this.submit}
						onDelete={this.deleteServerHistory}
						onPressServerHistory={this.onPressServerHistory}
					/>
					<Button
						title={I18n.t('Connect')}
						type='primary'
						onPress={this.submit}
						disabled={!text || connecting}
						loading={connecting}
						style={styles.connectButton}
						testID='new-server-view-button'
					/>
				</FormContainerInner>
				{this.renderCertificatePicker()}
			</FormContainer>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	connecting: state.server.connecting,
	previousServer: state.server.previousServer
});

export default connect(mapStateToProps)(withTheme(NewServerView));
