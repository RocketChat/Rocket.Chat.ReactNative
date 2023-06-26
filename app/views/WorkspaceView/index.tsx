import React from 'react';
import { Text, View } from 'react-native';
import { StackNavigationProp, StackNavigationOptions } from '@react-navigation/stack';
import { connect } from 'react-redux';
import { CompositeNavigationProp } from '@react-navigation/core';

import { OutsideModalParamList, OutsideParamList } from '../../stacks/types';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import { themes } from '../../lib/constants';
import { TSupportedThemes, withTheme } from '../../theme';
import FormContainer, { FormContainerInner } from '../../containers/FormContainer';
import { IApplicationState } from '../../definitions';
import { IAssetsFavicon512 } from '../../definitions/IAssetsFavicon512';
import { getShowLoginButton } from '../../selectors/login';
import ServerAvatar from './ServerAvatar';
import styles from './styles';

interface IWorkSpaceProp {
	navigation: CompositeNavigationProp<
		StackNavigationProp<OutsideParamList, 'WorkspaceView'>,
		StackNavigationProp<OutsideModalParamList>
	>;
	theme?: TSupportedThemes;
	Site_Name: string;
	Site_Url: string;
	server: string;
	Assets_favicon_512: IAssetsFavicon512;
	registrationForm: string;
	registrationText: string;
	showLoginButton: boolean;
	Accounts_iframe_enabled: boolean;
	inviteLinkToken: string;
}

class WorkspaceView extends React.Component<IWorkSpaceProp, any> {
	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Your_workspace')
	});

	get showRegistrationButton() {
		const { registrationForm, inviteLinkToken, Accounts_iframe_enabled } = this.props;
		return (
			!Accounts_iframe_enabled &&
			(registrationForm === 'Public' || (registrationForm === 'Secret URL' && inviteLinkToken?.length))
		);
	}

	login = () => {
		const { navigation, server, Site_Name, Accounts_iframe_enabled } = this.props;
		if (Accounts_iframe_enabled) {
			navigation.navigate('AuthenticationWebView', { url: server, authType: 'iframe' });
			return;
		}
		navigation.navigate('LoginView', { title: Site_Name });
	};

	register = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('RegisterView', { title: Site_Name });
	};

	renderRegisterDisabled = () => {
		const { Accounts_iframe_enabled, registrationText, theme } = this.props;
		if (Accounts_iframe_enabled) {
			return null;
		}

		return <Text style={[styles.registrationText, { color: themes[theme!].auxiliaryText }]}>{registrationText}</Text>;
	};

	render() {
		const { theme, Site_Name, Site_Url, Assets_favicon_512, server, showLoginButton } = this.props;

		return (
			<FormContainer testID='workspace-view'>
				<FormContainerInner>
					<View style={styles.alignItemsCenter}>
						<ServerAvatar theme={theme!} url={server} image={Assets_favicon_512?.url ?? Assets_favicon_512?.defaultUrl} />
						<Text style={[styles.serverName, { color: themes[theme!].titleText }]}>{Site_Name}</Text>
						<Text style={[styles.serverUrl, { color: themes[theme!].auxiliaryText }]}>{Site_Url}</Text>
					</View>
					{showLoginButton ? (
						<Button title={I18n.t('Login')} type='primary' onPress={this.login} testID='workspace-view-login' />
					) : null}
					{this.showRegistrationButton ? (
						<Button
							title={I18n.t('Create_account')}
							type='secondary'
							backgroundColor={themes[theme!].chatComponentBackground}
							onPress={this.register}
							testID='workspace-view-register'
						/>
					) : (
						this.renderRegisterDisabled()
					)}
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name as string,
	Site_Url: state.settings.Site_Url as string,
	Assets_favicon_512: state.settings.Assets_favicon_512 as IAssetsFavicon512,
	registrationForm: state.settings.Accounts_RegistrationForm as string,
	registrationText: state.settings.Accounts_RegistrationForm_LinkReplacementText as string,
	Accounts_iframe_enabled: state.settings.Accounts_iframe_enabled as boolean,
	showLoginButton: getShowLoginButton(state),
	inviteLinkToken: state.inviteLinks.token
});

export default connect(mapStateToProps)(withTheme(WorkspaceView));
