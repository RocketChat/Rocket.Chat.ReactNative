import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, StyleSheet
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import Orientation from 'react-native-orientation-locker';

import { loginRequest as loginRequestAction } from '../actions/login';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import StatusBar from '../containers/StatusBar';
import log from '../utils/log';
import { isTablet } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

class SetUsernameView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const title = navigation.getParam('title');
		return {
			title
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		userId: PropTypes.string,
		loginRequest: PropTypes.func,
		token: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			username: '',
			saving: false
		};
		const { server } = this.props;
		props.navigation.setParams({ title: server });
		if (!isTablet) {
			Orientation.lockToPortrait();
		}
	}

	async componentDidMount() {
		const suggestion = await RocketChat.getUsernameSuggestion();
		if (suggestion.success) {
			this.setState({ username: suggestion.result });
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { username, saving } = this.state;
		if (nextState.username !== username) {
			return true;
		}
		if (nextState.saving !== saving) {
			return true;
		}
		return false;
	}

	submit = async() => {
		const { username } = this.state;
		const { loginRequest, token } = this.props;

		if (!username.trim()) {
			return;
		}

		this.setState({ saving: true });
		try {
			await RocketChat.setUsername(username);
			await loginRequest({ resume: token });
		} catch (e) {
			log(e);
		}
		this.setState({ saving: false });
	}

	render() {
		const { username, saving } = this.state;
		return (
			<KeyboardView contentContainerStyle={sharedStyles.container}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView style={sharedStyles.container} testID='set-username-view' forceInset={{ vertical: 'never' }}>
						<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, styles.loginTitle]}>{I18n.t('Username')}</Text>
						<Text style={[sharedStyles.loginSubtitle, sharedStyles.textRegular]}>{I18n.t('Set_username_subtitle')}</Text>
						<TextInput
							autoFocus
							placeholder={I18n.t('Username')}
							returnKeyType='send'
							iconLeft='at'
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
							loading={saving}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	token: state.login.user && state.login.user.token
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(SetUsernameView);
