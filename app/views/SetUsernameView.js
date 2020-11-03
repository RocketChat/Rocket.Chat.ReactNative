import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, StyleSheet
} from 'react-native';
import { connect } from 'react-redux';
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
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import { isTablet } from '../utils/deviceInfo';
import { getUserSelector } from '../selectors/login';
import { showErrorAlert } from '../utils/info';
import SafeAreaView from '../containers/SafeAreaView';

const styles = StyleSheet.create({
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

class SetUsernameView extends React.Component {
	static navigationOptions = ({ route }) => ({
		title: route.params?.title
	})

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		userId: PropTypes.string,
		loginRequest: PropTypes.func,
		token: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			username: '',
			saving: false
		};
		const { server } = this.props;
		props.navigation.setOptions({ title: server });
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
		const { theme } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}
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
			await RocketChat.saveUserProfile({ username });
			await loginRequest({ resume: token });
		} catch (e) {
			showErrorAlert(e.message, I18n.t('Oops'));
		}
		this.setState({ saving: false });
	}

	render() {
		const { username, saving } = this.state;
		const { theme } = this.props;
		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].auxiliaryBackground }}
				contentContainerStyle={sharedStyles.container}
			>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView testID='set-username-view'>
						<Text
							style={[
								sharedStyles.loginTitle,
								sharedStyles.textBold,
								styles.loginTitle,
								{ color: themes[theme].titleText }
							]}
						>
							{I18n.t('Username')}
						</Text>
						<Text
							style={[
								sharedStyles.loginSubtitle,
								sharedStyles.textRegular,
								{ color: themes[theme].titleText }
							]}
						>
							{I18n.t('Set_username_subtitle')}
						</Text>
						<TextInput
							autoFocus
							placeholder={I18n.t('Username')}
							returnKeyType='send'
							onChangeText={value => this.setState({ username: value })}
							value={username}
							onSubmitEditing={this.submit}
							testID='set-username-view-input'
							clearButtonMode='while-editing'
							containerStyle={sharedStyles.inputLastChild}
							theme={theme}
						/>
						<Button
							title={I18n.t('Register')}
							type='primary'
							onPress={this.submit}
							testID='set-username-view-submit'
							disabled={!username}
							loading={saving}
							theme={theme}
						/>
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	token: getUserSelector(state).token
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SetUsernameView));
