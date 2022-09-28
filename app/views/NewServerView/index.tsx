import { Q } from '@nozbe/watermelondb';
import { Base64 } from 'js-base64';
import React from 'react';
import { BackHandler, Image, Keyboard, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Orientation from 'react-native-orientation-locker';
import { connect } from 'react-redux';
import parse from 'url-parse';

import { inviteLinksClear } from '../../actions/inviteLinks';
import { selectServerRequest, serverFinishAdd, serverRequest } from '../../actions/server';
import { CERTIFICATE_KEY, themes } from '../../lib/constants';
import Button from '../../containers/Button';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import * as HeaderButton from '../../containers/HeaderButton';
import OrSeparator from '../../containers/OrSeparator';
import { IApplicationState, IBaseScreen, TServerHistoryModel } from '../../definitions';
import { withDimensions } from '../../dimensions';
import I18n from '../../i18n';
import database from '../../lib/database';
import { sanitizeLikeString } from '../../lib/database/utils';
import UserPreferences from '../../lib/methods/userPreferences';
import { OutsideParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import { isTablet } from '../../lib/methods/helpers';
import EventEmitter from '../../lib/methods/helpers/events';
import { BASIC_AUTH_KEY, setBasicAuth } from '../../lib/methods/helpers/fetch';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { moderateScale, verticalScale } from './scaling';
import SSLPinning from '../../lib/methods/helpers/sslPinning';
import sharedStyles from '../Styles';
import ServerInput from './ServerInput';
import { serializeAsciiUrl } from '../../lib/methods';

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

interface INewServerViewProps extends IBaseScreen<OutsideParamList, 'NewServerView'> {
	connecting: boolean;
	previousServer: string | null;
	width: number;
	height: number;
}

interface INewServerViewState {
	text: string;
	connectingOpen: boolean;
	certificate: string | null;
	serversHistory: TServerHistoryModel[];
}

interface ISubmitParams {
	fromServerHistory?: boolean;
	username?: string;
}

class NewServerView extends React.Component<INewServerViewProps, INewServerViewState> {
	constructor(props: INewServerViewProps) {
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
				headerTitle: I18n.t('Workspaces'),
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
			const serversHistory = await serversHistoryCollection.query(...whereClause).fetch();
			this.setState({ serversHistory });
		} catch {
			// Do nothing
		}
	};

	close = () => {
		const { dispatch, previousServer } = this.props;

		dispatch(inviteLinksClear());
		if (previousServer) {
			dispatch(selectServerRequest(previousServer));
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

		this.setState({ connectingOpen: false });

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

	connectOpen = () => {
		logEvent(events.NS_JOIN_OPEN_WORKSPACE);
		this.setState({ connectingOpen: true });
		const { dispatch } = this.props;
		dispatch(serverRequest('https://open.rocket.chat'));
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
		const { certificate } = this.state;
		const { theme, width, height, previousServer } = this.props;
		return (
			<View
				style={[
					styles.certificatePicker,
					{
						marginBottom: verticalScale({ size: previousServer && !isTablet ? 10 : 30, height })
					}
				]}
			>
				<Text
					style={[
						styles.chooseCertificateTitle,
						{ color: themes[theme].auxiliaryText, fontSize: moderateScale({ size: 13, width }) }
					]}
				>
					{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
				</Text>
				<TouchableOpacity
					onPress={certificate ? this.handleRemove : this.chooseCertificate}
					testID='new-server-choose-certificate'
				>
					<Text
						style={[styles.chooseCertificate, { color: themes[theme].tintColor, fontSize: moderateScale({ size: 13, width }) }]}
					>
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
			<FormContainer testID='new-server-view' keyboardShouldPersistTaps='never'>
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
						]}
					>
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
						]}
					>
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
						]}
					>
						{I18n.t('Onboarding_join_open_description')}
					</Text>
					<Button
						title={I18n.t('Join_our_open_workspace')}
						type='secondary'
						backgroundColor={themes[theme].chatComponentBackground}
						onPress={this.connectOpen}
						disabled={connecting}
						loading={connectingOpen && connecting}
						testID='new-server-view-open'
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

export default connect(mapStateToProps)(withDimensions(withTheme(NewServerView)));
