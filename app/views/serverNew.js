import React from 'react';
import PropTypes from 'prop-types';
import { Navigation } from 'react-native-navigation';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { serverRequest, addServer } from '../actions/server';
import KeyboardView from '../presentation/KeyboardView';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'stretch',
		backgroundColor: '#fff'
	},
	input: {
		height: 40,
		borderColor: '#aaa',
		margin: 20,
		padding: 5,
		borderWidth: 0,
		backgroundColor: '#f8f8f8'
	},
	text: {
		textAlign: 'center',
		color: '#888'
	},
	validateText: {
		position: 'absolute',
		color: 'green',
		textAlign: 'center',
		paddingLeft: 50,
		paddingRight: 50,
		width: '100%'
	},
	validText: {
		color: 'green'
	},
	invalidText: {
		color: 'red'
	},
	validatingText: {
		color: '#aaa'
	},
	spaceView: {
		flexGrow: 1
	}
});
@connect(state => ({
	validInstance: !state.server.failure,
	validating: state.server.connecting
}), dispatch => ({
	validateServer: url => dispatch(serverRequest(url)),
	addServer: url => dispatch(addServer(url))
}))
export default class NewServerView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		validateServer: PropTypes.func.isRequired,
		addServer: PropTypes.func.isRequired,
		validating: PropTypes.bool.isRequired,
		validInstance: PropTypes.bool.isRequired
	}

	static navigationOptions = () => ({
		title: 'New Server Connection'
	});

	constructor(props) {
		super(props);
		this.state = {
			defaultServer: 'https://demo.rocket.chat',
			editable: true,
			text: ''
		};

		this.submit = () => {
			this.props.addServer(this.completeUrl(this.state.text.trim() || this.state.defaultServer));
		};
	}

	componentDidMount() {
		this.props.navigator.setTitle({
			title: 'New server'
		});

		this.props.navigator.setButtons({
			rightButtons: [{
				id: 'close',
				title: 'Cancel'
			}],
			animated: true
		});

		this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}
	onNavigatorEvent = (event) => {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'close') {
				Navigation.dismissModal({
					animationType: 'slide-down'
				});
			}
		}
	}

	onChangeText = (text) => {
		this.setState({ text });
		this.props.validateServer(this.completeUrl(text));
	}
	completeUrl = (url) => {
		url = url.trim();

		if (/^(\w|[0-9-_]){3,}$/.test(url) && /^(htt(ps?)?)|(loca((l)?|(lh)?|(lho)?|(lhos)?|(lhost:?\d*)?)$)/.test(url) === false) {
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
					Validating {this.state.url} ...
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
			<KeyboardView style={styles.view} keyboardVerticalOffset={64}>
				<View style={styles.spaceView} />
				<TextInput
					ref={ref => this.inputElement = ref}
					style={styles.input}
					onChangeText={this.onChangeText}
					keyboardType='url'
					autoCorrect={false}
					returnKeyType='done'
					autoCapitalize='none'
					autoFocus
					editable={this.state.editable}
					onSubmitEditing={this.submit}
					placeholder={this.state.defaultServer}
				/>
				<View style={styles.spaceView}>
					{this.renderValidation()}
				</View>
			</KeyboardView>
		);
	}
}
