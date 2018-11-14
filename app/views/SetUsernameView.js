import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, Alert, StyleSheet
} from 'react-native';
import { connect } from 'react-redux';
import SafeAreaView from 'react-native-safe-area-view';
import equal from 'deep-equal';
import { Navigation } from 'react-native-navigation';

import { setUsernameSubmit as setUsernameSubmitAction } from '../actions/login';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import LoggedView from './View';
import I18n from '../i18n';
import { DARK_HEADER } from '../constants/headerOptions';
import RocketChat from '../lib/rocketchat';

const styles = StyleSheet.create({
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

@connect(state => ({
	server: state.server.server,
	login: state.login
}), dispatch => ({
	setUsernameSubmit: params => dispatch(setUsernameSubmitAction(params))
}))
/** @extends React.Component */
export default class SetUsernameView extends LoggedView {
	static options() {
		return {
			...DARK_HEADER
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		server: PropTypes.string,
		setUsernameSubmit: PropTypes.func.isRequired,
		Accounts_UsernamePlaceholder: PropTypes.string,
		login: PropTypes.object
	}

	constructor(props) {
		super('SetUsernameView', props);
		this.state = {
			username: ''
		};
		const { componentId, server } = this.props;
		Navigation.mergeOptions(componentId, {
			topBar: {
				title: {
					text: server
				}
			}
		});
	}

	async componentDidMount() {
		this.timeout = setTimeout(() => {
			this.usernameInput.focus();
		}, 600);
		const suggestion = await RocketChat.getUsernameSuggestion();
		this.setState({ username: suggestion });
	}

	componentDidUpdate(prevProps) {
		const { login } = this.props;
		if (login && login.failure && login.error && !equal(login.error, prevProps.login.error)) {
			Alert.alert(I18n.t('Oops'), login.error.reason);
		}
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	submit = () => {
		const { username } = this.state;
		const { setUsernameSubmit } = this.props;
		setUsernameSubmit({ username });
	}

	render() {
		const { username } = this.state;
		const { login } = this.props;
		return (
			<KeyboardView contentContainerStyle={sharedStyles.container}>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='set-username-view' forceInset={{ bottom: 'never' }}>
						<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, styles.loginTitle]}>{I18n.t('Username')}</Text>
						<Text style={[sharedStyles.loginSubtitle, sharedStyles.textRegular]}>{I18n.t('Set_username_subtitle')}</Text>
						<TextInput
							inputRef={e => this.usernameInput = e}
							placeholder={I18n.t('Username')}
							returnKeyType='send'
							iconLeft='mention'
							onChangeText={value => this.setState({ username: value })}
							value={username}
							onSubmitEditing={this.submit}
							testID='set-username-view-input'
							clearButtonMode='while-editing'
							containerStyle={sharedStyles.inputLastChild}
						/>
						<Button
							title={I18n.t('Register')}
							type='primary'
							onPress={this.submit}
							testID='set-username-view-submit'
							disabled={!username}
							loading={login.isFetching}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
