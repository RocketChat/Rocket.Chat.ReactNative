import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import Button from '../../containers/Button';
import styles from './styles';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import ServerAvatar from './ServerAvatar';
import { getShowLoginButton } from '../../selectors/login';

class WorkspaceView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Your_workspace')
	}

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		Site_Name: PropTypes.string,
		Site_Url: PropTypes.string,
		server: PropTypes.string,
		Assets_favicon_512: PropTypes.object,
		registrationForm: PropTypes.string,
		registrationText: PropTypes.string,
		showLoginButton: PropTypes.bool,
		inviteLinkToken: PropTypes.string
	}

	get showRegistrationButton() {
		const { registrationForm, inviteLinkToken } = this.props;
		return registrationForm === 'Public' || (registrationForm === 'Secret URL' && inviteLinkToken?.length);
	}

	login = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('LoginView', { title: Site_Name });
	}

	register = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('RegisterView', { title: Site_Name });
	}

	render() {
		const {
			theme, Site_Name, Site_Url, Assets_favicon_512, server, registrationText, showLoginButton
		} = this.props;
		return (
			<FormContainer theme={theme} testID='workspace-view'>
				<FormContainerInner>
					<View style={styles.alignItemsCenter}>
						<ServerAvatar theme={theme} url={server} image={Assets_favicon_512 && Assets_favicon_512.defaultUrl} />
						<Text style={[styles.serverName, { color: themes[theme].titleText }]}>{Site_Name}</Text>
						<Text style={[styles.serverUrl, { color: themes[theme].auxiliaryText }]}>{Site_Url}</Text>
					</View>
					{showLoginButton
						? (
							<Button
								title={I18n.t('Login')}
								type='primary'
								onPress={this.login}
								theme={theme}
								testID='workspace-view-login'
							/>
						) : null}
					{
						this.showRegistrationButton ? (
							<Button
								title={I18n.t('Create_account')}
								type='secondary'
								backgroundColor={themes[theme].chatComponentBackground}
								onPress={this.register}
								theme={theme}
								testID='workspace-view-register'
							/>
						) : (
							<Text style={[styles.registrationText, { color: themes[theme].auxiliaryText }]}>{registrationText}</Text>
						)
					}
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
	Assets_favicon_512: state.settings.Assets_favicon_512,
	registrationForm: state.settings.Accounts_RegistrationForm,
	registrationText: state.settings.Accounts_RegistrationForm_LinkReplacementText,
	showLoginButton: getShowLoginButton(state),
	inviteLinkToken: state.inviteLinks.token
});

export default connect(mapStateToProps)(withTheme(WorkspaceView));
