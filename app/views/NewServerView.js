import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, Keyboard, Image, StyleSheet, TouchableOpacity, View, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import * as FileSystem from 'expo-file-system';
import DocumentPicker from 'react-native-document-picker';
import ActionSheet from 'react-native-action-sheet';
import isEqual from 'deep-equal';
import RNUserDefaults from 'rn-user-defaults';
import { encode } from 'base-64';
import parse from 'url-parse';

import { serverRequest } from '../actions/server';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import I18n from '../i18n';
import { verticalScale, moderateScale } from '../utils/scaling';
import KeyboardView from '../presentation/KeyboardView';
import { isIOS, isNotch, isTablet } from '../utils/deviceInfo';
import { CustomIcon } from '../lib/Icons';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import log from '../utils/log';
import { animateNextTransition } from '../utils/layoutAnimation';
import { withTheme } from '../theme';
import { setBasicAuth, BASIC_AUTH_KEY } from '../utils/fetch';

const styles = StyleSheet.create({
	image: {
		alignSelf: 'center',
		marginVertical: verticalScale(20),
		width: 210,
		height: 171
	},
	title: {
		...sharedStyles.textBold,
		fontSize: moderateScale(22),
		letterSpacing: 0,
		alignSelf: 'center'
	},
	inputContainer: {
		marginTop: 25,
		marginBottom: 15
	},
	backButton: {
		position: 'absolute',
		paddingHorizontal: 9,
		left: 15
	},
	certificatePicker: {
		flex: 1,
		marginTop: 40,
		alignItems: 'center',
		justifyContent: 'center'
	},
	chooseCertificateTitle: {
		fontSize: 15,
		...sharedStyles.textRegular
	},
	chooseCertificate: {
		fontSize: 15,
		...sharedStyles.textSemibold
	}
});

const defaultServer = 'https://open.rocket.chat';

class NewServerView extends React.Component {
	static navigationOptions = () => ({
		header: null
	})

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		theme: PropTypes.string,
		connecting: PropTypes.bool.isRequired,
		connectServer: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		const server = props.navigation.getParam('server');

		// Cancel
		this.options = [I18n.t('Cancel')];
		this.CANCEL_INDEX = 0;

		// Delete
		this.options.push(I18n.t('Delete'));
		this.DELETE_INDEX = 1;

		this.state = {
			text: server || '',
			autoFocus: !server,
			certificate: null
		};
	}

	componentDidMount() {
		const { text } = this.state;
		const { connectServer } = this.props;
		if (text) {
			connectServer(text);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { text, certificate } = this.state;
		const { connecting, theme } = this.props;
		if (nextState.text !== text) {
			return true;
		}
		if (!isEqual(nextState.certificate, certificate)) {
			return true;
		}
		if (nextProps.connecting !== connecting) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	onChangeText = (text) => {
		this.setState({ text });
	}

	submit = async() => {
		const { text, certificate } = this.state;
		const { connectServer } = this.props;
		let cert = null;

		if (certificate) {
			const certificatePath = `${ FileSystem.documentDirectory }/${ certificate.name }`;
			try {
				await FileSystem.copyAsync({ from: certificate.path, to: certificatePath });
			} catch (e) {
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
			connectServer(server, cert);
		}
	}

	basicAuth = async(server, text) => {
		try {
			const parsedUrl = parse(text, true);
			if (parsedUrl.auth.length) {
				const credentials = encode(parsedUrl.auth);
				await RNUserDefaults.set(`${ BASIC_AUTH_KEY }-${ server }`, credentials);
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
			url = parsedUrl.host;
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

	handleDelete = () => this.setState({ certificate: null }); // We not need delete file from DocumentPicker because it is a temp file

	showActionSheet = () => {
		ActionSheet.showActionSheetWithOptions({
			options: this.options,
			cancelButtonIndex: this.CANCEL_INDEX,
			destructiveButtonIndex: this.DELETE_INDEX
		}, (actionIndex) => {
			if (actionIndex === this.DELETE_INDEX) { this.handleDelete(); }
		});
	}

	renderBack = () => {
		const { navigation, theme } = this.props;

		let top = 15;
		if (isIOS) {
			top = isNotch ? 45 : 30;
		}

		return (
			<TouchableOpacity
				style={[styles.backButton, { top }]}
				onPress={() => navigation.pop()}
			>
				<CustomIcon
					name='back'
					size={30}
					color={themes[theme].tintColor}
				/>
			</TouchableOpacity>
		);
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
					onPress={certificate ? this.showActionSheet : this.chooseCertificate}
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
		const { text, autoFocus } = this.state;
		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<StatusBar theme={theme} />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='new-server-view'>
						<Image style={styles.image} source={{ uri: 'new_server' }} />
						<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Sign_in_your_server')}</Text>
						<View style={isTablet && sharedStyles.tabletScreenContent}>
							<TextInput
								autoFocus={autoFocus}
								containerStyle={styles.inputContainer}
								placeholder={defaultServer}
								value={text}
								returnKeyType='send'
								onChangeText={this.onChangeText}
								testID='new-server-view-input'
								onSubmitEditing={this.submit}
								clearButtonMode='while-editing'
								keyboardType='url'
								textContentType='URL'
								theme={theme}
							/>
							<Button
								title={I18n.t('Connect')}
								type='primary'
								onPress={this.submit}
								disabled={!text}
								loading={connecting}
								testID='new-server-view-button'
								theme={theme}
							/>
							{ isIOS ? this.renderCertificatePicker() : null }
						</View>
					</SafeAreaView>
				</ScrollView>
				{this.renderBack()}
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	connecting: state.server.connecting
});

const mapDispatchToProps = dispatch => ({
	connectServer: (server, certificate) => dispatch(serverRequest(server, certificate))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(NewServerView));
