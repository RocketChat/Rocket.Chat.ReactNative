import React from 'react';
import PropTypes from 'prop-types';
import { Text, ScrollView, View, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';

import { serverRequest, addServer } from '../actions/server';
import KeyboardView from '../presentation/KeyboardView';
import styles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import Button from '../containers/Button';
import TextInput from '../containers/TextInput';
import Loading from '../containers/Loading';

@connect(state => ({
	validInstance: !state.server.failure && !state.server.connecting,
	validating: state.server.connecting,
	addingServer: state.server.adding
}), dispatch => ({
	validateServer: url => dispatch(serverRequest(url)),
	addServer: url => dispatch(addServer(url))
}))
export default class NewServerView extends React.Component {
	static propTypes = {
		validateServer: PropTypes.func.isRequired,
		addServer: PropTypes.func.isRequired,
		validating: PropTypes.bool.isRequired,
		validInstance: PropTypes.bool.isRequired,
		addingServer: PropTypes.bool.isRequired,
		navigation: PropTypes.object.isRequired
	}

	constructor(props) {
		super(props);
		this.state = {
			defaultServer: 'https://open.rocket.chat'
		};
		this.props.validateServer(this.state.defaultServer); // Need to call because in case of submit with empty field
	}

	componentDidMount() {
		this.input.focus();
	}

	onChangeText = (text) => {
		this.setState({ text });
		this.props.validateServer(this.completeUrl(text));
	}

	submit = () => {
		this.props.addServer(this.completeUrl(this.state.text));
		this.props.navigation.navigate('LoginSignup');
	}

	completeUrl = (url) => {
		url = url && url.trim();

		if (!url) {
			return this.state.defaultServer;
		}

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

	renderValidation = () => {
		if (this.props.validating) {
			return (
				<Text style={[styles.validateText, styles.validatingText]}>
					Validating {this.state.text || 'open'} ...
				</Text>
			);
		}

		if (this.props.validInstance) {
			return (
				<Text style={[styles.validateText, styles.validText]}>
					{this.state.url} is a valid Rocket.Chat instance
				</Text>
			);
		}
		return (
			<Text style={[styles.validateText, styles.invalidText]}>
				{this.state.url} is not a valid Rocket.Chat instance
			</Text>
		);
	}

	render() {
		const { validInstance } = this.props;
		return (
			<KeyboardView
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={styles.containerScrollView}>
					<SafeAreaView>
						<Text style={[styles.loginText, styles.loginTitle]}>Sign in your server</Text>
						<TextInput
							inputRef={e => this.input = e}
							containerStyle={{ marginBottom: 5 }}
							label='Your server'
							placeholder={this.state.defaultServer}
							returnKeyType='done'
							onChangeText={this.onChangeText}
						/>
						{this.renderValidation()}
						<View style={[styles.alignItemsFlexStart, { marginTop: 20 }]}>
							<Button
								title='Connect'
								type='primary'
								onPress={this.submit}
								disabled={!validInstance}
							/>
						</View>
						<Loading visible={this.props.addingServer} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
