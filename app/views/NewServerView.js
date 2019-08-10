import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, Keyboard, Image, StyleSheet, TouchableOpacity, View, Platform
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import DocumentPicker from 'react-native-document-picker';
import Dialog from 'react-native-dialog';

import { serverRequest } from '../actions/server';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import I18n from '../i18n';
import { verticalScale, moderateScale } from '../utils/scaling';
import KeyboardView from '../presentation/KeyboardView';
import { isIOS, isNotch } from '../utils/deviceInfo';
import { CustomIcon } from '../lib/Icons';
import StatusBar from '../containers/StatusBar';
import { COLOR_PRIMARY } from '../constants/colors';
import log from '../utils/log';

const styles = StyleSheet.create({
	image: {
		alignSelf: 'center',
		marginVertical: verticalScale(20),
		width: 210,
		height: 171
	},
	title: {
		...sharedStyles.textBold,
		...sharedStyles.textColorNormal,
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
		alignItems: 'center',
		justifyContent: 'center'
	},
	chooseCertificateTitle: {
		fontSize: 15,
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription
	},
	chooseCertificate: {
		fontSize: 15,
		...sharedStyles.textSemibold,
		...sharedStyles.textColorHeaderBack
	},
	dialogInput: Platform.select({
		ios: {},
		android: {
			borderRadius: 4,
			borderColor: 'rgba(0,0,0,.15)',
			borderWidth: 2,
			paddingHorizontal: 10
		}
	})
});

const defaultServer = 'https://open.rocket.chat';

class NewServerView extends React.Component {
	static navigationOptions = () => ({
		header: null
	})

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		connecting: PropTypes.bool.isRequired,
		connectServer: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		const server = props.navigation.getParam('server');
		this.state = {
			text: server || '',
			autoFocus: !server,
			showPasswordAlert: false,
			path: null,
			password: null,
			name: null
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
		const { text, name, showPasswordAlert } = this.state;
		const { connecting } = this.props;
		if (nextState.text !== text) {
			return true;
		}
		if (nextState.name !== name) {
			return true;
		}
		if (nextState.showPasswordAlert !== showPasswordAlert) {
			return true;
		}
		if (nextProps.connecting !== connecting) {
			return true;
		}
		return false;
	}

	onChangeText = (text) => {
		this.setState({ text });
	}

	submit = () => {
		const { text, path, password } = this.state;
		const { connectServer } = this.props;

		const certificate = { path, password };

		if (text) {
			Keyboard.dismiss();
			connectServer(this.completeUrl(text), certificate);
		}
	}

	chooseCertificate = async() => {
		try {
			const res = await DocumentPicker.pick({
				type: ['com.rsa.pkcs-12']
			});
			this.setState({ path: res.uri.replace('file://', ''), name: res.name, showPasswordAlert: true });
		} catch (error) {
			if (!DocumentPicker.isCancel(error)) {
				log('chooseCertificate', error);
			}
		}
	}

	completeUrl = (url) => {
		url = url && url.trim();

		if (/^(\w|[0-9-_]){3,}$/.test(url)
			&& /^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
			url = `${ url }.rocket.chat`;
		}

		if (/^(https?:\/\/)?(((\w|[0-9])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
			if (/^localhost(:\d+)?/.test(url)) {
				url = `http://${ url }`;
			} else if (/^https?:\/\//.test(url) === false) {
				url = `https://${ url }`;
			}
		}

		return url.replace(/\/+$/, '');
	}

	renderBack = () => {
		const { navigation } = this.props;

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
					color={COLOR_PRIMARY}
				/>
			</TouchableOpacity>
		);
	}

	saveCertificate = () => this.setState({ showPasswordAlert: false });

	renderCertificatePassword = () => {
		const { showPasswordAlert } = this.state;
		return (
			<Dialog.Container visible={showPasswordAlert}>
				<Dialog.Title>
					{I18n.t('Certificate_password')}
				</Dialog.Title>
				<Dialog.Description>
					{I18n.t('Whats_the_password_for_your_certificate')}
				</Dialog.Description>
				<Dialog.Input
					onChangeText={value => this.setState({ password: value })}
					secureTextEntry
					testID='certificate-password-input'
					style={styles.dialogInput}
				/>
				<Dialog.Button label='OK' onPress={this.saveCertificate} />
			</Dialog.Container>
		);
	}

	renderCertificatePicker = () => {
		const { name } = this.state;
		return (
			<View style={styles.certificatePicker}>
				<Text style={styles.chooseCertificateTitle}>{name ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}</Text>
				<TouchableOpacity onPress={this.chooseCertificate} testID='new-server-choose-certificate'>
					<Text style={styles.chooseCertificate}>{name || I18n.t('Apply_Your_Certificate')}</Text>
				</TouchableOpacity>
			</View>
		);
	}

	render() {
		const { connecting } = this.props;
		const { text, autoFocus } = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<StatusBar light />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='new-server-view'>
						<Image style={styles.image} source={{ uri: 'new_server' }} />
						<Text style={styles.title}>{I18n.t('Sign_in_your_server')}</Text>
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
						/>
						<Button
							title={I18n.t('Connect')}
							type='primary'
							onPress={this.submit}
							disabled={!text}
							loading={connecting}
							testID='new-server-view-button'
						/>
						{isIOS ? this.renderCertificatePicker() : null}
						{isIOS ? this.renderCertificatePassword() : null}
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

export default connect(mapStateToProps, mapDispatchToProps)(NewServerView);
