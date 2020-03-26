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
import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import OnboardingSeparator from '../containers/OnboardingSeparator';
import FormContainer from '../containers/FormContainer';
import I18n from '../i18n';
import { isIOS, isTablet } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import log from '../utils/log';
import { animateNextTransition } from '../utils/layoutAnimation';
import { withTheme } from '../theme';
import { setBasicAuth, BASIC_AUTH_KEY } from '../utils/fetch';
import { themedHeader } from '../utils/navigation';

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 22,
		letterSpacing: 0,
		textAlign: 'auto'
	},
	inputContainer: {
		marginTop: 24,
		marginBottom: 32
	},
	certificatePicker: {
		// flex: 1,
		marginBottom: 32,
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	chooseCertificateTitle: {
		fontSize: 15,
		...sharedStyles.textRegular
	},
	chooseCertificate: {
		fontSize: 15,
		...sharedStyles.textSemibold
	},
	description: {
		...sharedStyles.textRegular,
		fontSize: 14,
		textAlign: 'left',
		marginBottom: 24
	}
});

class NewServerView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Workspaces'),
		...themedHeader(screenProps.theme)
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
		const { text } = this.state;
		return (
			<FormContainer theme={theme}>
				<View style={{ flex: 1, justifyContent: 'center' }}>
					<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Join_your_workspace')}</Text>
					<TextInput
						label='Enter workspace URL'
						placeholder='Ex. your-company.rocket.chat'
						containerStyle={styles.inputContainer}
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
						style={{ marginBottom: 0 }}
						testID='new-server-view-button'
						theme={theme}
					/>
					<OnboardingSeparator theme={theme} />
					<Text style={[styles.description, { color: themes[theme].auxiliaryText }]}>{I18n.t('Onboarding_join_open_description')}</Text>
					<Button
						title={I18n.t('Join_our_open_workspace')}
						type='secondary'
						backgroundColor={themes[theme].chatComponentBackground}
						onPress={this.submit}
						// loading={connecting} TODO: connecting to open
						theme={theme}
					/>
				</View>
				{ isIOS ? this.renderCertificatePicker() : null }
			</FormContainer>
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
