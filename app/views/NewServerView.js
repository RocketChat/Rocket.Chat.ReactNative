import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, Keyboard, Image, StyleSheet, TouchableOpacity, View, Picker
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import { serverRequest } from '../actions/server';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import LoggedView from './View';
import I18n from '../i18n';
import { verticalScale, moderateScale } from '../utils/scaling';
import KeyboardView from '../presentation/KeyboardView';
import { isIOS, isNotch } from '../utils/deviceInfo';
import { CustomIcon } from '../lib/Icons';
import StatusBar from '../containers/StatusBar';
import { COLOR_PRIMARY } from '../constants/colors';

const PROTOCOl_HTTP = 'http://';
const PROTOCOL_HTTPS = 'https://';

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
		flex: 1,
		marginTop: 25,
		marginBottom: 15,
		flexDirection: 'row'
	},
	backButton: {
		position: 'absolute',
		paddingHorizontal: 9,
		left: 15
	},
	picker: {
		width: 120
	},
	input: {
		flex: 1
	}
});

const defaultServer = 'open.rocket.chat';

@connect(state => ({
	connecting: state.server.connecting
}), dispatch => ({
	connectServer: server => dispatch(serverRequest(server))
}))
/** @extends React.Component */
export default class NewServerView extends LoggedView {
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
		super('NewServerView', props);
		this.state = {
			text: '',
			protocolType: PROTOCOL_HTTPS
		};
	}

	componentDidMount() {
		const { navigation, connectServer } = this.props;
		const server = navigation.getParam('server');
		if (server) {
			connectServer(server);
			this.setState({ text: server });
		} else {
			this.timeout = setTimeout(() => {
				this.input.focus();
			}, 600);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { text, protocolType } = this.state;
		const { connecting } = this.props;
		if (nextState.text !== text) {
			return true;
		}
		if (nextState.protocolType !== protocolType) {
			return true;
		}
		if (nextProps.connecting !== connecting) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	onChangeText = (text) => {
		this.setState({ text });
	}

	handlePickerValueChange = (itemValue) => {
		this.setState({ protocolType: itemValue });
	}

	submit = () => {
		const { text } = this.state;
		const { connectServer } = this.props;

		if (text) {
			Keyboard.dismiss();
			connectServer(this.completeUrl(text));
		}
	}

	completeUrl = (url) => {
		const { protocolType } = this.state;
		url = url && url.trim();

		if (/^(\w|[0-9-_]){3,}$/.test(url)
			&& /^(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
			url = `${ url }.rocket.chat`;
		}
		url = protocolType + url;
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

	renderInput() {
		const { text, protocolType } = this.state;
		return (
			<View
				style={styles.inputContainer}
			>
				<Picker
					mode='dropdown'
					selectedValue={protocolType}
					onValueChange={this.handlePickerValueChange}
					style={styles.picker}
				>
					<Picker.Item label={PROTOCOL_HTTPS} value={PROTOCOL_HTTPS} />
					<Picker.Item label={PROTOCOl_HTTP} value={PROTOCOl_HTTP} />
				</Picker>
				<TextInput
					inputRef={e => this.input = e}
					placeholder={defaultServer}
					value={text}
					containerStyle={styles.input}
					returnKeyType='send'
					onChangeText={this.onChangeText}
					testID='new-server-view-input'
					onSubmitEditing={this.submit}
					clearButtonMode='while-editing'
				/>
			</View>
		);
	}

	render() {
		const { connecting } = this.props;
		const { text } = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<StatusBar light />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='new-server-view' forceInset={{ bottom: 'never' }}>
						<Image style={styles.image} source={{ uri: 'new_server' }} />
						<Text style={styles.title}>{I18n.t('Sign_in_your_server')}</Text>
						{this.renderInput()}
						<Button
							title={I18n.t('Connect')}
							type='primary'
							onPress={this.submit}
							disabled={text.length === 0}
							loading={connecting}
							testID='new-server-view-button'
						/>
					</SafeAreaView>
				</ScrollView>
				{this.renderBack()}
			</KeyboardView>
		);
	}
}
