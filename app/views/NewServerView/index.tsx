import React from 'react';
import { Text, Keyboard, StyleSheet, View, BackHandler, Image } from 'react-native';
import { connect } from 'react-redux';
import { Base64 } from 'js-base64';
import parse from 'url-parse';
import { Q } from '@nozbe/watermelondb';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Orientation from 'react-native-orientation-locker';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';

import UserPreferences from '../../lib/userPreferences';
import EventEmitter from '../../utils/events';
import { selectServerRequest, serverRequest, serverFinishAdd as serverFinishAddAction } from '../../actions/server';
import { inviteLinksClear as inviteLinksClearAction } from '../../actions/inviteLinks';
import sharedStyles from '../Styles';
import Button from '../../containers/Button';
import OrSeparator from '../../containers/OrSeparator';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { events, logEvent } from '../../utils/log';
import { withTheme } from '../../theme';
import { BASIC_AUTH_KEY, setBasicAuth } from '../../utils/fetch';
import * as HeaderButton from '../../containers/HeaderButton';
import { showConfirmationAlert } from '../../utils/info';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import SSLPinning from '../../utils/sslPinning';
import RocketChat from '../../lib/rocketchat';
import { isTablet } from '../../utils/deviceInfo';
import { verticalScale, moderateScale } from '../../utils/scaling';
import { withDimensions } from '../../dimensions';
import ServerInput from './ServerInput';
import { OutsideParamList } from '../../stacks/types';
import { TServerHistory } from '../../definitions/IServerHistory';

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

interface INewServerView {
	navigation: StackNavigationProp<OutsideParamList, 'NewServerView'>;
	theme: string;
	connecting: boolean;
	connectServer(server: string, username?: string, fromServerHistory?: boolean): void;
	selectServer(server: string): void;
	previousServer: string;
	inviteLinksClear(): void;
	serverFinishAdd(): void;
	width: number;
	height: number;
}

interface IState {
	text: string;
	connectingOpen: boolean;
	certificate: any;
	serversHistory: TServerHistory[];
}

interface ISubmitParams {
	fromServerHistory?: boolean;
	username?: string;
}

class NewServerView extends React.Component<INewServerView, IState> {
	constructor(props: INewServerView) {
		super(props);
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
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

	componentWillUnmount() {
		EventEmitter.removeListener('NewServer', this.handleNewServerEvent);
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
		const { previousServer, serverFinishAdd } = this.props;
		if (previousServer) {
			serverFinishAdd();
		}
	}

	setHeader = () => {
		const { previousServer, navigation } = this.props;
		if (previousServer) {
			return navigation.setOptions({
				headerTitle: I18n.t('Workspaces'),
				headerLeft: () => <HeaderButton.CloseModal navigation={navigation} onPress={this.close} testID='new-server-view-close' />
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

	onChangeText = (text: string) => {
		this.setState({ text });
		this.queryServerHistory(text);
	};

	queryServerHistory = async (text?: string) => {
		const db = database.servers;
		try {
			const serversHistoryCollection = db.get('servers_history');
			let whereClause = [Q.where('username', Q.notEq(null)), Q.experimentalSortBy('updated_at', Q.desc), Q.experimentalTake(3)];
			if (text) {
				const likeString = sanitizeLikeString(text);
				whereClause = [...whereClause, Q.where('url', Q.like(`%${likeString}%`))];
			}
			const serversHistory = (await serversHistoryCollection.query(...whereClause).fetch()) as TServerHistory[];
			this.setState({ serversHistory });
		} catch {
			// Do nothing
		}
	};

	close = () => {
		const { selectServer, previousServer, inviteLinksClear } = this.props;
		inviteLinksClear();
		selectServer(previousServer);
	};

	handleNewServerEvent = (event: { server: string }) => {
		let { server } = event;
		if (!server) {
			return;
		}
		const { connectServer } = this.props;
		this.setState({ text: server });
		server = this.completeUrl(server);
		connectServer(server);
	};

	onPressServerHistory = (serverHistory: TServerHistory) => {
		this.setState({ text: serverHistory.url }, () => this.submit({ fromServerHistory: true, username: serverHistory?.username }));
	};

	submit = async ({ fromServerHistory = false, username }: ISubmitParams = {}) => {
		logEvent(events.NS_CONNECT_TO_WORKSPACE);
		const { text, certificate } = this.state;
		const { connectServer } = this.props;

		this.setState({ connectingOpen: false });

		if (text) {
			Keyboard.dismiss();
			const server = this.completeUrl(text);

			// Save info - SSL Pinning
			await UserPreferences.setStringAsync(`${RocketChat.CERTIFICATE_KEY}-${server}`, certificate);

			// Save info - HTTP Basic Authentication
			await this.basicAuth(server, text);

			if (fromServerHistory) {
				connectServer(server, username, true);
			} else {
				connectServer(server);
			}
		}
	};

	connectOpen = () => {
		logEvent(events.NS_JOIN_OPEN_WORKSPACE);
		this.setState({ connectingOpen: true });
		const { connectServer } = this.props;
		connectServer('https://open.rocket.chat');
	};

	basicAuth = async (server: string, text: string) => {
		try {
			const parsedUrl = parse(text, true);
			if (parsedUrl.auth.length) {
				const credentials = Base64.encode(parsedUrl.auth);
				await UserPreferences.setStringAsync(`${BASIC_AUTH_KEY}-${server}`, credentials);
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

		return url.replace(/\/+$/, '').replace(/\\/g, '/');
	};

	uriToPath = (uri: string) => uri.replace('file://', '');

	handleRemove = () => {
		showConfirmationAlert({
			message: I18n.t('You_will_unset_a_certificate_for_this_server'),
			confirmationText: I18n.t('Remove'),
			// @ts-ignore
			onPress: this.setState({ certificate: null }) // We not need delete file from DocumentPicker because it is a temp file
		});
	};

	deleteServerHistory = async (item: TServerHistory) => {
		const db = database.servers;
		try {
			await db.write(async () => {
				await item.destroyPermanently();
			});
			this.setState((prevstate: IState) => ({
				serversHistory: prevstate.serversHistory.filter((server: TServerHistory) => server.id !== item.id)
			}));
		} catch {
			// Nothing
		}
	};

	renderCertificatePicker = () => {
		const { certificate } = this.state;
		const { theme, width, height, previousServer } = this.props;
		return (
			<View
				style={[
					styles.certificatePicker,
					{
						marginBottom: verticalScale({ size: previousServer && !isTablet ? 10 : 30, height })
					}
				]}>
				<Text
					style={[
						styles.chooseCertificateTitle,
						{ color: themes[theme].auxiliaryText, fontSize: moderateScale({ size: 13, width }) }
					]}>
					{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
				</Text>
				<TouchableOpacity
					onPress={certificate ? this.handleRemove : this.chooseCertificate}
					testID='new-server-choose-certificate'>
					<Text
						style={[styles.chooseCertificate, { color: themes[theme].tintColor, fontSize: moderateScale({ size: 13, width }) }]}>
						{certificate ?? I18n.t('Apply_Your_Certificate')}
					</Text>
				</TouchableOpacity>
			</View>
		);
	};

	render() {
		const { connecting, theme, previousServer, width, height } = this.props;
		const { text, connectingOpen, serversHistory } = this.state;
		const marginTop = previousServer ? 0 : 35;

		return (
			<FormContainer theme={theme} testID='new-server-view' keyboardShouldPersistTaps='never'>
				<FormContainerInner>
					<Image
						style={[
							styles.onboardingImage,
							{
								marginBottom: verticalScale({ size: 10, height }),
								marginTop: isTablet ? 0 : verticalScale({ size: marginTop, height }),
								width: verticalScale({ size: 100, height }),
								height: verticalScale({ size: 100, height })
							}
						]}
						source={require('../../static/images/logo.png')}
						fadeDuration={0}
					/>
					<Text
						style={[
							styles.title,
							{
								color: themes[theme].titleText,
								fontSize: moderateScale({ size: 22, width }),
								marginBottom: verticalScale({ size: 8, height })
							}
						]}>
						Rocket.Chat
					</Text>
					<Text
						style={[
							styles.subtitle,
							{
								color: themes[theme].controlText,
								fontSize: moderateScale({ size: 16, width }),
								marginBottom: verticalScale({ size: 30, height })
							}
						]}>
						{I18n.t('Onboarding_subtitle')}
					</Text>
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
						style={[styles.connectButton, { marginTop: verticalScale({ size: 16, height }) }]}
						theme={theme}
						testID='new-server-view-button'
					/>
					<OrSeparator theme={theme} />
					<Text
						style={[
							styles.description,
							{
								color: themes[theme].auxiliaryText,
								fontSize: moderateScale({ size: 14, width }),
								marginBottom: verticalScale({ size: 16, height })
							}
						]}>
						{I18n.t('Onboarding_join_open_description')}
					</Text>
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
				{this.renderCertificatePicker()}
			</FormContainer>
		);
	}
}

const mapStateToProps = (state: any) => ({
	connecting: state.server.connecting,
	previousServer: state.server.previousServer
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
	connectServer: (server: string, username: string & null, fromServerHistory?: boolean) =>
		dispatch(serverRequest(server, username, fromServerHistory)),
	selectServer: (server: string) => dispatch(selectServerRequest(server)),
	inviteLinksClear: () => dispatch(inviteLinksClearAction()),
	serverFinishAdd: () => dispatch(serverFinishAddAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withDimensions(withTheme(NewServerView)));
