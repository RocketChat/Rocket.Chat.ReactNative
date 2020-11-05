import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, Keyboard, StyleSheet, View, Alert, BackHandler
} from 'react-native';
import { connect } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import DocumentPicker from 'react-native-document-picker';
import { Base64 } from 'js-base64';
import parse from 'url-parse';
import { Q } from '@nozbe/watermelondb';

import { TouchableOpacity } from 'react-native-gesture-handler';
import UserPreferences from '../../lib/userPreferences';
import EventEmitter from '../../utils/events';
import { selectServerRequest, serverRequest } from '../../actions/server';
import { inviteLinksClear as inviteLinksClearAction } from '../../actions/inviteLinks';
import sharedStyles from '../Styles';
import Button from '../../containers/Button';
import OrSeparator from '../../containers/OrSeparator';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import I18n from '../../i18n';
import { isIOS } from '../../utils/deviceInfo';
import { themes } from '../../constants/colors';
import log, { logEvent, events } from '../../utils/log';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { withTheme } from '../../theme';
import { setBasicAuth, BASIC_AUTH_KEY } from '../../utils/fetch';
import * as HeaderButton from '../../containers/HeaderButton';
import { showConfirmationAlert } from '../../utils/info';
import database from '../../lib/database';
import ServerInput from './ServerInput';
import { sanitizeLikeString } from '../../lib/database/utils';

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 22
	},
	certificatePicker: {
		marginBottom: 32,
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	chooseCertificateTitle: {
		fontSize: 13,
		...sharedStyles.textRegular
	},
	chooseCertificate: {
		fontSize: 13,
		...sharedStyles.textSemibold
	},
	description: {
		...sharedStyles.textRegular,
		fontSize: 14,
		textAlign: 'left',
		marginBottom: 24
	},
	connectButton: {
		marginBottom: 0
	}
});

class NewServerView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Workspaces')
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		connecting: PropTypes.bool.isRequired,
		connectServer: PropTypes.func.isRequired,
		selectServer: PropTypes.func.isRequired,
		adding: PropTypes.bool,
		previousServer: PropTypes.string,
		inviteLinksClear: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.setHeader();

		this.state = {
			text: '',
			connectingOpen: false,
			certificate: null,
			serversHistory: []
		};
		EventEmitter.addEventListener('NewServer', this.handleNewServerEvent);
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
	}

	componentDidMount() {
		this.queryServerHistory();
	}

	componentDidUpdate(prevProps) {
		const { adding } = this.props;
		if (prevProps.adding !== adding) {
			this.setHeader();
		}
	}

	componentWillUnmount() {
		EventEmitter.removeListener('NewServer', this.handleNewServerEvent);
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
	}

	setHeader = () => {
		const { adding, navigation } = this.props;
		if (adding) {
			navigation.setOptions({
				headerLeft: () => <HeaderButton.CloseModal navigation={navigation} onPress={this.close} testID='new-server-view-close' />
			});
		}
	}

	handleBackPress = () => {
		const { navigation, previousServer } = this.props;
		if (navigation.isFocused() && previousServer) {
			this.close();
			return true;
		}
		return false;
	}

	onChangeText = (text) => {
		this.setState({ text });
		this.queryServerHistory(text);
	}

	queryServerHistory = async(text) => {
		const db = database.servers;
		try {
			const serversHistoryCollection = db.collections.get('servers_history');
			let whereClause = [
				Q.where('username', Q.notEq(null)),
				Q.experimentalSortBy('updated_at', Q.desc),
				Q.experimentalTake(3)
			];
			const likeString = sanitizeLikeString(text);
			if (text) {
				whereClause = [
					...whereClause,
					Q.where('url', Q.like(`%${ likeString }%`))
				];
			}
			const serversHistory = await serversHistoryCollection.query(...whereClause).fetch();
			this.setState({ serversHistory });
		} catch {
			// Do nothing
		}
	}

	close = () => {
		const { selectServer, previousServer, inviteLinksClear } = this.props;
		inviteLinksClear();
		selectServer(previousServer);
	}

	handleNewServerEvent = (event) => {
		let { server } = event;
		const { connectServer } = this.props;
		this.setState({ text: server });
		server = this.completeUrl(server);
		connectServer(server);
	}

	onPressServerHistory = (serverHistory) => {
		this.setState({ text: serverHistory?.url }, () => this.submit({ fromServerHistory: true, username: serverHistory?.username }));
	}

	submit = async({ fromServerHistory = false, username }) => {
		logEvent(events.NEWSERVER_CONNECT_TO_WORKSPACE);
		const { text, certificate } = this.state;
		const { connectServer } = this.props;
		let cert = null;

		this.setState({ connectingOpen: false });

		if (certificate) {
			const certificatePath = `${ FileSystem.documentDirectory }/${ certificate.name }`;
			try {
				await FileSystem.copyAsync({ from: certificate.path, to: certificatePath });
			} catch (e) {
				logEvent(events.NEWSERVER_CONNECT_TO_WORKSPACE_F);
				log(e);
			}
			cert = {
				path: this.uriToPath(certificatePath), // file:// isn't allowed by obj-C
				password: certificate.password
			};
		}

		if (text) {
			Keyboard.dismiss();
			const server = this.completeUrl(text);
			await this.basicAuth(server, text);
			if (fromServerHistory) {
				connectServer(server, cert, username, true);
			} else {
				connectServer(server, cert);
			}
		}
	}

	connectOpen = () => {
		logEvent(events.NEWSERVER_JOIN_OPEN_WORKSPACE);
		this.setState({ connectingOpen: true });
		const { connectServer } = this.props;
		connectServer('https://open.rocket.chat');
	}

	basicAuth = async(server, text) => {
		try {
			const parsedUrl = parse(text, true);
			if (parsedUrl.auth.length) {
				const credentials = Base64.encode(parsedUrl.auth);
				await UserPreferences.setStringAsync(`${ BASIC_AUTH_KEY }-${ server }`, credentials);
				setBasicAuth(credentials);
			}
		} catch {
			// do nothing
		}
	}

	chooseCertificate = async() => {
		try {
			const res = await DocumentPicker.pick({
				type: ['com.rsa.pkcs-12']
			});
			const { uri: path, name } = res;
			Alert.prompt(
				I18n.t('Certificate_password'),
				I18n.t('Whats_the_password_for_your_certificate'),
				[
					{
						text: 'OK',
						onPress: password => this.saveCertificate({ path, name, password })
					}
				],
				'secure-text'
			);
		} catch (e) {
			if (!DocumentPicker.isCancel(e)) {
				log(e);
			}
		}
	}

	completeUrl = (url) => {
		const parsedUrl = parse(url, true);
		if (parsedUrl.auth.length) {
			url = parsedUrl.origin;
		}

		url = url && url.replace(/\s/g, '');

		if (/^(\w|[0-9-_]){3,}$/.test(url)
			&& /^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
			url = `${ url }.rocket.chat`;
		}

		if (/^(https?:\/\/)?(((\w|[0-9-_])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
			if (/^localhost(:\d+)?/.test(url)) {
				url = `http://${ url }`;
			} else if (/^https?:\/\//.test(url) === false) {
				url = `https://${ url }`;
			}
		}

		return url.replace(/\/+$/, '').replace(/\\/g, '/');
	}

	uriToPath = uri => uri.replace('file://', '');

	saveCertificate = (certificate) => {
		animateNextTransition();
		this.setState({ certificate });
	}

	handleRemove = () => {
		showConfirmationAlert({
			message: I18n.t('You_will_unset_a_certificate_for_this_server'),
			confirmationText: I18n.t('Remove'),
			onPress: this.setState({ certificate: null }) // We not need delete file from DocumentPicker because it is a temp file
		});
	}

	deleteServerHistory = async(item) => {
		const { serversHistory } = this.state;
		const db = database.servers;
		try {
			await db.action(async() => {
				await item.destroyPermanently();
			});
			this.setState({ serversHistory: serversHistory.filter(server => server.id !== item.id) });
		} catch {
			// Nothing
		}
	}

	renderCertificatePicker = () => {
		const { certificate } = this.state;
		const { theme } = this.props;
		return (
			<View style={styles.certificatePicker}>
				<Text
					style={[
						styles.chooseCertificateTitle,
						{ color: themes[theme].auxiliaryText }
					]}
				>
					{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
				</Text>
				<TouchableOpacity
					onPress={certificate ? this.handleRemove : this.chooseCertificate}
					testID='new-server-choose-certificate'
				>
					<Text
						style={[
							styles.chooseCertificate,
							{ color: themes[theme].tintColor }
						]}
					>
						{certificate ? certificate.name : I18n.t('Apply_Your_Certificate')}
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	render() {
		const { connecting, theme } = this.props;
		const {
			text, connectingOpen, serversHistory
		} = this.state;
		return (
			<FormContainer
				theme={theme}
				testID='new-server-view'
				keyboardShouldPersistTaps='never'
			>
				<FormContainerInner>
					<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Join_your_workspace')}</Text>
					<ServerInput
						text={text}
						theme={theme}
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
						loading={!connectingOpen && connecting}
						style={styles.connectButton}
						theme={theme}
						testID='new-server-view-button'
					/>
					<OrSeparator theme={theme} />
					<Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{I18n.t('Onboarding_join_open_description')}</Text>
					<Button
						title={I18n.t('Join_our_open_workspace')}
						type='secondary'
						backgroundColor={themes[theme].chatComponentBackground}
						onPress={this.connectOpen}
						disabled={connecting}
						loading={connectingOpen && connecting}
						theme={theme}
						testID='new-server-view-open'
					/>
				</FormContainerInner>
				{isIOS ? this.renderCertificatePicker() : null}
			</FormContainer>
		);
	}
}

const mapStateToProps = state => ({
	connecting: state.server.connecting,
	adding: state.server.adding,
	previousServer: state.server.previousServer
});

const mapDispatchToProps = dispatch => ({
	connectServer: (server, certificate, username, fromServerHistory) => dispatch(serverRequest(server, certificate, username, fromServerHistory)),
	selectServer: server => dispatch(selectServerRequest(server)),
	inviteLinksClear: () => dispatch(inviteLinksClearAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(NewServerView));
