import React from 'react';
import {
	View, Text, Image, BackHandler, Linking
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Orientation from 'react-native-orientation-locker';

import { appStart as appStartAction } from '../../actions';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import styles from './styles';
import sharedStyles from '../Styles';
import { isTablet } from '../../utils/deviceInfo';
import EventEmitter from '../../utils/events';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import { themedHeader } from '../../utils/navigation';
import ServerAvatar from './ServerAvatar';

class WorkspaceView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Your_workspace'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		adding: PropTypes.bool,
		selectServer: PropTypes.func.isRequired,
		currentServer: PropTypes.string,
		initAdd: PropTypes.func,
		finishAdd: PropTypes.func,
		appStart: PropTypes.func,
		theme: PropTypes.string
	}

	login = () => {
		const { navigation } = this.props;
		navigation.navigate('LoginView');
	}

	register = () => {
		const { navigation } = this.props;
		navigation.navigate('RegisterView');
	}

	render() {
		const { theme, Site_Name, Site_Url, Assets_favicon_512, server } = this.props;
		return (
			<FormContainer theme={theme}>
				<FormContainerInner>
					<View style={{ alignItems: 'center' }}>
						<ServerAvatar theme={theme} url={server} image={Assets_favicon_512 && Assets_favicon_512.defaultUrl} />
						<Text style={[styles.serverName, { color: themes[theme].titleText }]}>{Site_Name}</Text>
						<Text style={[styles.serverUrl, { color: themes[theme].auxiliaryText }]}>{Site_Url}</Text>
					</View>
					<Button
						title={I18n.t('Login')}
						type='primary'
						onPress={this.login}
						theme={theme}
					/>
					<Button
						title={I18n.t('Create_account')}
						type='secondary'
						backgroundColor={themes[theme].chatComponentBackground}
						onPress={this.register}
						theme={theme}
					/>
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	adding: state.server.adding,
	Site_Name: state.settings.Site_Name,
	Site_Url: state.settings.Site_Url,
	Assets_favicon_512: state.settings.Assets_favicon_512
});

export default connect(mapStateToProps)(withTheme(WorkspaceView));
