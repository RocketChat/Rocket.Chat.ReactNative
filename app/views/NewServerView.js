import React from 'react';
import PropTypes from 'prop-types';
import { Text, ScrollView, Keyboard, SafeAreaView, Image, Alert, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import { serverRequest, selectServerRequest, serverInitAdd, serverFinishAdd } from '../actions/server';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import LoggedView from './View';
import I18n from '../i18n';
import { scale, verticalScale, moderateScale } from '../utils/scaling';
import KeyboardView from '../presentation/KeyboardView';

const styles = StyleSheet.create({
	image: {
		alignSelf: 'center',
		marginVertical: verticalScale(20)
	},
	title: {
		alignSelf: 'center',
		color: '#2F343D',
		fontSize: moderateScale(22),
		fontWeight: 'bold',
		height: verticalScale(28),
		lineHeight: verticalScale(28)
	},
	inputContainer: {
		marginTop: scale(20),
		marginBottom: scale(20)
	},
	input: {
		color: '#9EA2A8',
		fontSize: 17,
		paddingTop: 14,
		paddingBottom: 14,
		paddingHorizontal: 16
	}
});

const defaultServer = 'https://open.rocket.chat';

@connect(state => ({
	connecting: state.server.connecting,
	failure: state.server.failure,
	currentServer: state.server.server,
	adding: state.server.adding
}), dispatch => ({
	initAdd: () => dispatch(serverInitAdd()),
	finishAdd: () => dispatch(serverFinishAdd()),
	connectServer: server => dispatch(serverRequest(server)),
	selectServer: server => dispatch(selectServerRequest(server))
}))
/** @extends React.Component */
export default class NewServerView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		server: PropTypes.string,
		connecting: PropTypes.bool.isRequired,
		adding: PropTypes.bool,
		failure: PropTypes.bool.isRequired,
		connectServer: PropTypes.func.isRequired,
		selectServer: PropTypes.func.isRequired,
		previousServer: PropTypes.string,
		currentServer: PropTypes.string,
		initAdd: PropTypes.func,
		finishAdd: PropTypes.func
	}

	constructor(props) {
		super('NewServerView', props);
		this.state = {
			text: ''
		};
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentDidMount() {
		const { server, previousServer } = this.props;
		if (server) {
			this.props.connectServer(server);
			this.setState({ text: server });
		} else {
			setTimeout(() => {
				this.input.focus();
			}, 600);
		}
		if (previousServer) {
			this.props.initAdd();
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.failure && nextProps.failure !== this.props.failure) {
			Alert.alert(I18n.t('Oops'), I18n.t('The_URL_is_invalid'));
		}
	}

	componentWillUnmount() {
		const {
			selectServer, previousServer, currentServer, adding, finishAdd
		} = this.props;
		if (adding) {
			if (previousServer !== currentServer) {
				selectServer(previousServer);
			}
			finishAdd();
		}
	}

	onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'cancel') {
				this.props.navigator.dismissModal();
			}
		}
	}

	onChangeText = (text) => {
		this.setState({ text });
	}

	submit = () => {
		if (this.state.text) {
			Keyboard.dismiss();
			this.props.connectServer(this.completeUrl(this.state.text));
		}
	}

	completeUrl = (url) => {
		url = url && url.trim();

		if (/^(\w|[0-9-_]){3,}$/.test(url) &&
				/^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
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

	render() {
		const { connecting } = this.props;
		const { text } = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
				key='login-view'
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='new-server-view'>
						<Image style={styles.image} source={require('../static/images/server.png')} />
						<Text style={styles.title}>{I18n.t('Sign_in_your_server')}</Text>
						<TextInput
							inputRef={e => this.input = e}
							containerStyle={styles.inputContainer}
							inputStyle={styles.input}
							placeholder={defaultServer}
							value={text}
							returnKeyType='done'
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
			</KeyboardView>
		);
	}
}
