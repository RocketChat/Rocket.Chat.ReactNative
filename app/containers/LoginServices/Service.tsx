import React, { useRef } from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { TIconsName } from '../CustomIcon';
import { IItemService, IOauthProvider } from './interfaces';
import styles from './styles';
import * as ServiceLogin from './serviceLogin';
import ButtonService from './ButtonService';

const Service = React.memo(
	({
		CAS_enabled,
		CAS_login_url,
		Gitlab_URL,
		server,
		service
	}: {
		service: IItemService;
		server: string;
		Gitlab_URL: string;
		CAS_enabled: boolean;
		CAS_login_url: string;
		storiesTestOnPress?: () => void;
	}) => {
		const { colors } = useTheme();
		const onPress = useRef<any>();
		const buttonText = useRef<React.ReactElement>();
		const modifiedName = useRef<string>();

		const { name } = service;
		modifiedName.current = name === 'meteor-developer' ? 'meteor' : name;
		const icon = `${modifiedName.current}-monochromatic` as TIconsName;
		const isSaml = service.service === 'saml';

		const getSocialOauthProvider = (name: string) => {
			const oauthProviders: IOauthProvider = {
				facebook: () => ServiceLogin.onPressFacebook({ service, server }),
				github: () => ServiceLogin.onPressGithub({ service, server }),
				gitlab: () => ServiceLogin.onPressGitlab({ service, server, urlOption: Gitlab_URL }),
				google: () => ServiceLogin.onPressGoogle({ service, server }),
				linkedin: () => ServiceLogin.onPressLinkedin({ service, server }),
				'meteor-developer': () => ServiceLogin.onPressMeteor({ service, server }),
				twitter: () => ServiceLogin.onPressTwitter({ service, server }),
				wordpress: () => ServiceLogin.onPressWordpress({ service, server })
			};
			return oauthProviders[name];
		};

		switch (service.authType) {
			case 'oauth': {
				onPress.current = getSocialOauthProvider(service.name);
				break;
			}
			case 'oauth_custom': {
				onPress.current = () => ServiceLogin.onPressCustomOAuth({ loginService: service, server });
				break;
			}
			case 'saml': {
				onPress.current = () => ServiceLogin.onPressSaml({ loginService: service, server });
				break;
			}
			case 'cas': {
				onPress.current = () => ServiceLogin.onPressCas({ casLoginUrl: CAS_login_url, server });
				break;
			}
			case 'apple': {
				onPress.current = () => ServiceLogin.onPressAppleLogin();
				break;
			}
			default:
				break;
		}

		modifiedName.current = modifiedName.current.charAt(0).toUpperCase() + modifiedName.current.slice(1);
		if (isSaml || (service.service === 'cas' && CAS_enabled)) {
			buttonText.current = (
				<Text style={[styles.serviceName, isSaml && { color: service.buttonLabelColor }]}>{modifiedName.current}</Text>
			);
		} else {
			buttonText.current = (
				<>
					{I18n.t('Continue_with')} <Text style={styles.serviceName}>{modifiedName.current}</Text>
				</>
			);
		}

		const backgroundColor = isSaml && service.buttonColor ? service.buttonColor : colors.buttonBackgroundSecondaryDefault;

		return (
			<ButtonService
				onPress={onPress.current}
				backgroundColor={backgroundColor}
				buttonText={buttonText.current}
				icon={icon}
				name={service.name}
				authType={service.authType}
				accessibilityLabel={`${I18n.t('Continue_with')} ${modifiedName.current}`}
			/>
		);
	}
);

export default Service;
