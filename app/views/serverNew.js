import React from 'react';
import PropTypes from 'prop-types';
import { Navigation } from 'react-native-navigation';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import _ from 'underscore';
import realm from '../lib/realm';

import KeyboardView from '../components/KeyboardView';

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

export default class NewServerView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired
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
			let url = this.state.text.trim();
			if (!url) {
				url = this.state.defaultServer;
			} else {
				url = this.completeUrl(this.state.text);
			}

			this.setState({
				editable: false
			});

			this.inputElement.blur();
			this.validateServer(url).then(() => {
				realm.write(() => {
					realm.create('servers', { id: url, current: false }, true);
				});
				Navigation.dismissModal({
					animationType: 'slide-down'
				});
			}).catch(() => {
				this.setState({
					editable: true
				});
				this.inputElement.focus();
			});
		};
	}

	componentDidMount() {
		this._mounted = true;

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

	componentWillUnmount() {
		this._mounted = false;
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

		this.validateServerDebounced(text);
	}

	validateServer = url => new Promise((resolve, reject) => {
		url = this.completeUrl(url);

		this.setState({
			validating: false,
			url
		});

		if (/^(https?:\/\/)?(((\w|[0-9])+(\.(\w|[0-9-_])+)+)|localhost)(:\d+)?$/.test(url)) {
			this.setState({
				validating: true
			});

			fetch(url, { method: 'HEAD' })
				.then((response) => {
					if (!this._mounted) {
						return;
					}
					if (response.status === 200 && response.headers.get('x-instance-id') != null && response.headers.get('x-instance-id').length) {
						this.setState({
							validInstance: true,
							validating: false
						});
						resolve(url);
					} else {
						this.setState({
							validInstance: false,
							validating: false
						});
						reject(url);
					}
				})
				.catch(() => {
					if (!this._mounted) {
						return;
					}
					this.setState({
						validInstance: false,
						validating: false
					});
					reject(url);
				});

		} else {
			this.setState({
				validInstance: undefined
			});
			reject(url);
		}
	})

	validateServerDebounced = _.debounce(this.validateServer, 1000)

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

		url = url.replace(/\/+$/, '');

		return url;
	}

	renderValidation = () => {
		if (this.state.validating) {
			return (
				<Text style={[styles.validateText, styles.validatingText]}>
					Validating {this.state.url} ...
				</Text>
			);
		}

		if (this.state.validInstance) {
			return (
				<Text style={[styles.validateText, styles.validText]}>
					{this.state.url} is a valid Rocket.Chat instance
				</Text>
			);
		}

		if (this.state.validInstance === false) {
			return (
				<Text style={[styles.validateText, styles.invalidText]}>
					{this.state.url} is not a valid Rocket.Chat instance
				</Text>
			);
		}
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
