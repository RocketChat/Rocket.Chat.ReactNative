import { RouteProp } from '@react-navigation/native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { loginRequest } from '../actions/login';
import { themes } from '../lib/constants';
import Button from '../containers/Button';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import TextInput from '../containers/TextInput';
import { IApplicationState } from '../definitions';
import { SetUsernameStackParamList } from '../definitions/navigationTypes';
import I18n from '../i18n';
import KeyboardView from '../containers/KeyboardView';
import { getUserSelector } from '../selectors/login';
import { TSupportedThemes, withTheme } from '../theme';
import { isTablet } from '../utils/deviceInfo';
import { showErrorAlert } from '../utils/info';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import sharedStyles from './Styles';
import { Services } from '../lib/services';

const styles = StyleSheet.create({
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

interface ISetUsernameViewState {
	username: string;
	saving: boolean;
}

interface ISetUsernameViewProps {
	navigation: StackNavigationProp<SetUsernameStackParamList, 'SetUsernameView'>;
	route: RouteProp<SetUsernameStackParamList, 'SetUsernameView'>;
	server: string;
	userId: string;
	token: string;
	theme: TSupportedThemes;
	dispatch: Dispatch;
}

class SetUsernameView extends React.Component<ISetUsernameViewProps, ISetUsernameViewState> {
	static navigationOptions = ({ route }: Pick<ISetUsernameViewProps, 'route'>): StackNavigationOptions => ({
		title: route.params?.title
	});

	constructor(props: ISetUsernameViewProps) {
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
		const suggestion = await Services.getUsernameSuggestion();
		if (suggestion.success) {
			this.setState({ username: suggestion.result });
		}
	}

	shouldComponentUpdate(nextProps: ISetUsernameViewProps, nextState: ISetUsernameViewState) {
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

	submit = async () => {
		const { username } = this.state;
		const { dispatch, token } = this.props;

		if (!username.trim()) {
			return;
		}

		this.setState({ saving: true });
		try {
			await Services.saveUserProfile({ username });
			dispatch(loginRequest({ resume: token }));
		} catch (e: any) {
			showErrorAlert(e.message, I18n.t('Oops'));
		}
		this.setState({ saving: false });
	};

	render() {
		const { username, saving } = this.state;
		const { theme } = this.props;
		return (
			<KeyboardView style={{ backgroundColor: themes[theme].auxiliaryBackground }} contentContainerStyle={sharedStyles.container}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<SafeAreaView testID='set-username-view'>
						<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, styles.loginTitle, { color: themes[theme].titleText }]}>
							{I18n.t('Username')}
						</Text>
						<Text style={[sharedStyles.loginSubtitle, sharedStyles.textRegular, { color: themes[theme].titleText }]}>
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

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	token: getUserSelector(state).token
});

export default connect(mapStateToProps)(withTheme(SetUsernameView));
