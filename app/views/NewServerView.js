import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, Keyboard, Image, StyleSheet, TouchableOpacity
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
	input: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorDescription,
		fontSize: 17,
		letterSpacing: 0,
		paddingTop: 14,
		paddingBottom: 14,
		paddingLeft: 16,
		paddingRight: 16
	},
	backButton: {
		position: 'absolute',
		paddingHorizontal: 9,
		left: 15
	}
});

const defaultServer = 'https://open.rocket.chat';

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
			text: ''
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
		const { text } = this.state;
		const { connecting } = this.props;
		if (nextState.text !== text) {
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

	submit = () => {
		const { text } = this.state;
		const { connectServer } = this.props;

		if (text) {
			Keyboard.dismiss();
			connectServer(this.completeUrl(text));
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
						<TextInput
							inputRef={e => this.input = e}
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
