import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { connect } from 'react-redux';
import { serverRequest, addServer } from '../actions/server';
import KeyboardView from '../presentation/KeyboardView';
import styles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';

@connect(state => ({
	validInstance: !state.server.failure && !state.server.connecting,
	validating: state.server.connecting
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
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = () => ({
		title: 'New Server Connection'
	});

	constructor(props) {
		super(props);
		this.state = {
			defaultServer: 'https://open.rocket.chat',
			editable: true,
			text: ''
		};
		this.adding = false;
		this.props.validateServer(this.state.defaultServer); // Need to call because in case of submit with empty field
	}

	componentDidUpdate() {
		if (this.adding) {
			if (!this.props.validInstance) {
				/* eslint-disable react/no-did-update-set-state */
				this.setState({ editable: true });
				this.adding = false;
			}
			if (this.props.validInstance) {
				this.props.navigation.goBack();
				this.adding = false;
			}
		}
	}

	onChangeText = (text) => {
		this.setState({ text });
		this.props.validateServer(this.completeUrl(text));
	}

	submit = () => {
		this.setState({ editable: false });
		this.adding = true;
		this.props.addServer(this.completeUrl(this.state.text.trim() || this.state.defaultServer));
	}

	completeUrl = (url) => {
		url = url.trim();

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
		if (!this.state.text.trim()) {
			return null;
		}
		if (this.props.validating) {
			return (
				<Text style={[styles.validateText, styles.validatingText]}>
					Validating {this.state.text} ...
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
		return (
			<KeyboardView
				contentContainerStyle={styles.container}
				keyboardVerticalOffset={128}
			>
				<ScrollView
					style={styles.loginView}
					{...scrollPersistTaps}
				>
					<TextInput
						ref={ref => this.inputElement = ref}
						style={styles.input_white}
						onChangeText={this.onChangeText}
						keyboardType='url'
						autoCorrect={false}
						returnKeyType='done'
						autoCapitalize='none'
						autoFocus
						editable={this.state.editable}
						placeholder={this.state.defaultServer}
						underlineColorAndroid='transparent'
					/>
					<TouchableOpacity
						disabled={!this.props.validInstance}
						style={[styles.buttonContainer, this.props.validInstance ? null
							: styles.disabledButton]}
						onPress={this.submit}
					>
						<Text style={styles.button} accessibilityTraits='button'>Add</Text>
					</TouchableOpacity>
					{this.renderValidation()}
				</ScrollView>
			</KeyboardView>
		);
	}
}
