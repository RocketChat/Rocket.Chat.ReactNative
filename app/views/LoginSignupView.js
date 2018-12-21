import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, ScrollView, Image, StyleSheet, Dimensions, Animated, Easing
} from 'react-native';
import { connect, Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';
import { Base64 } from 'js-base64';
import SafeAreaView from 'react-native-safe-area-view';
import { gestureHandlerRootHOC, RectButton, BorderlessButton } from 'react-native-gesture-handler';
import equal from 'deep-equal';

import LoggedView from './View';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import random from '../utils/random';
import Button from '../containers/Button';
import I18n from '../i18n';
import store from '../lib/createStore';
import { DARK_HEADER } from '../constants/headerOptions';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 30
	},
	safeArea: {
		paddingBottom: 30
	},
	serviceButton: {
		borderRadius: 2,
		marginBottom: 10
	},
	serviceButtonContainer: {
		borderRadius: 2,
		borderWidth: 1,
		borderColor: '#e1e5e8',
		width: '100%',
		height: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	serviceIcon: {
		position: 'absolute',
		left: 15,
		top: 12,
		width: 24,
		height: 24
	},
	serviceText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		color: '#2f343d'
	},
	serviceName: {
		...sharedStyles.textBold
	},
	servicesTogglerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 5,
		marginBottom: 30
	},
	servicesToggler: {
		width: 32,
		height: 31
	},
	separatorContainer: {
		marginTop: 5,
		marginBottom: 15
	},
	separatorLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#e1e5e8'
	},
	separatorLineLeft: {
		marginRight: 15
	},
	separatorLineRight: {
		marginLeft: 15
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	}
});

let OAuthView = null;
let LoginView = null;
let RegisterView = null;
let LegalView = null;
const SERVICE_HEIGHT = 58;
const SERVICES_COLLAPSED_HEIGHT = 174;

@connect(state => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name,
	services: state.login.services
}))
/** @extends React.Component */
export default class LoginSignupView extends LoggedView {
	static options() {
		return {
			...DARK_HEADER,
			topBar: {
				...DARK_HEADER.topBar,
				rightButtons: [{
					id: 'more',
					icon: { uri: 'more', scale: Dimensions.get('window').scale },
					testID: 'welcome-view-more'
				}]
			}
		};
	}

	static propTypes = {
		componentId: PropTypes.string,
		server: PropTypes.string,
		services: PropTypes.object,
		Site_Name: PropTypes.string
	}

	constructor(props) {
		super('LoginSignupView', props);
		this.state = {
			collapsed: true,
			servicesHeight: new Animated.Value(SERVICES_COLLAPSED_HEIGHT)
		};
		Navigation.events().bindComponent(this);
		const { componentId, Site_Name } = this.props;
		this.setTitle(componentId, Site_Name);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { collapsed, servicesHeight } = this.state;
		const { server, Site_Name, services } = this.props;
		if (nextState.collapsed !== collapsed) {
			return true;
		}
		if (nextState.servicesHeight !== servicesHeight) {
			return true;
		}
		if (nextProps.server !== server) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (!equal(nextProps.services, services)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const { componentId, Site_Name } = this.props;
		if (Site_Name && prevProps.Site_Name !== Site_Name) {
			this.setTitle(componentId, Site_Name);
		}
	}

	setTitle = (componentId, title) => {
		Navigation.mergeOptions(componentId, {
			topBar: {
				title: {
					text: title
				}
			}
		});
	}

	navigationButtonPressed = ({ buttonId }) => {
		if (buttonId === 'more') {
			if (LegalView == null) {
				LegalView = require('./LegalView').default;
				Navigation.registerComponentWithRedux('LegalView', () => gestureHandlerRootHOC(LegalView), Provider, store);
			}

			Navigation.showModal({
				stack: {
					children: [{
						component: {
							name: 'LegalView'
						}
					}]
				}
			});
		}
	}

	onPressFacebook = () => {
		const { services, server } = this.props;
		const { clientId } = services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGithub = () => {
		const { services, server } = this.props;
		const { clientId } = services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ server }/_oauth/github?close`;
		const scope = 'user:email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }`;
		this.openOAuth(`${ endpoint }${ encodeURIComponent(params) }`);
	}

	onPressGitlab = () => {
		const { services, server } = this.props;
		const { clientId } = services.gitlab;
		const endpoint = 'https://gitlab.com/oauth/authorize';
		const redirect_uri = `${ server }/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGoogle = () => {
		const { services, server } = this.props;
		const { clientId } = services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressLinkedin = () => {
		const { services, server } = this.props;
		const { clientId } = services.linkedin;
		const endpoint = 'https://www.linkedin.com/uas/oauth2/authorization';
		const redirect_uri = `${ server }/_oauth/linkedin?close`;
		const scope = 'r_emailaddress';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressMeteor = () => {
		const { services, server } = this.props;
		const { clientId } = services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${ server }/_oauth/meteor-developer`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressTwitter = () => {
		const { server } = this.props;
		const state = this.getOAuthState();
		const url = `${ server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth(url);
	}

	getOAuthState = () => {
		const credentialToken = random(43);
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	openOAuth = (oAuthUrl) => {
		if (OAuthView == null) {
			OAuthView = require('./OAuthView').default;
			Navigation.registerComponentWithRedux('OAuthView', () => gestureHandlerRootHOC(OAuthView), Provider, store);
		}

		Navigation.showModal({
			stack: {
				children: [{
					component: {
						name: 'OAuthView',
						passProps: {
							oAuthUrl
						},
						options: {
							topBar: {
								title: {
									text: 'OAuth'
								}
							}
						}
					}
				}]
			}
		});
	}

	login = () => {
		if (LoginView == null) {
			LoginView = require('./LoginView').default;
			Navigation.registerComponentWithRedux('LoginView', () => gestureHandlerRootHOC(LoginView), Provider, store);
		}

		const { componentId, Site_Name } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'LoginView',
				options: {
					topBar: {
						title: {
							text: Site_Name
						}
					}
				}
			}
		});
	}

	register = () => {
		if (RegisterView == null) {
			RegisterView = require('./RegisterView').default;
			Navigation.registerComponentWithRedux('RegisterView', () => gestureHandlerRootHOC(RegisterView), Provider, store);
		}

		const { componentId, Site_Name } = this.props;
		Navigation.push(componentId, {
			component: {
				name: 'RegisterView',
				options: {
					topBar: {
						title: {
							text: Site_Name
						}
					}
				}
			}
		});
	}

	transitionServicesTo = (height) => {
		const { servicesHeight } = this.state;
		if (this._animation) {
			this._animation.stop();
		}
		this._animation = Animated.timing(servicesHeight, {
			toValue: height,
			duration: 300,
			easing: Easing.easeOutCubic
		}).start();
	}

	toggleServices = () => {
		const { collapsed } = this.state;
		const { services } = this.props;
		const { length } = Object.values(services);
		if (collapsed) {
			this.transitionServicesTo(SERVICE_HEIGHT * length);
		} else {
			this.transitionServicesTo(SERVICES_COLLAPSED_HEIGHT);
		}
		this.setState(prevState => ({ collapsed: !prevState.collapsed }));
	}

	renderServicesSeparator = () => {
		const { collapsed } = this.state;
		const { services } = this.props;
		const { length } = Object.values(services);

		if (length > 3) {
			return (
				<View style={styles.servicesTogglerContainer}>
					<View style={[styles.separatorLine, styles.separatorLineLeft]} />
					<BorderlessButton onPress={this.toggleServices}>
						<Image source={{ uri: 'options' }} style={[styles.servicesToggler, !collapsed && styles.inverted]} />
					</BorderlessButton>
					<View style={[styles.separatorLine, styles.separatorLineRight]} />
				</View>
			);
		}
		return (
			<View style={styles.separatorContainer}>
				<View style={styles.separatorLine} />
			</View>
		);
	}

	renderItem = (service) => {
		let { name } = service;
		name = name === 'meteor-developer' ? 'meteor' : name;
		const icon = `icon_${ name }`;
		name = name.charAt(0).toUpperCase() + name.slice(1);
		let onPress = () => {};
		switch (service.name) {
			case 'facebook':
				onPress = this.onPressFacebook;
				break;
			case 'github':
				onPress = this.onPressGithub;
				break;
			case 'gitlab':
				onPress = this.onPressGitlab;
				break;
			case 'google':
				onPress = this.onPressGoogle;
				break;
			case 'linkedin':
				onPress = this.onPressLinkedin;
				break;
			case 'meteor-developer':
				onPress = this.onPressMeteor;
				break;
			case 'twitter':
				onPress = this.onPressTwitter;
				break;
			default:
				break;
		}
		return (
			<RectButton key={service.name} onPress={onPress} style={styles.serviceButton}>
				<View style={styles.serviceButtonContainer}>
					<Image source={{ uri: icon }} style={styles.serviceIcon} />
					<Text style={styles.serviceText}>
						{I18n.t('Continue_with')} <Text style={styles.serviceName}>{name}</Text>
					</Text>
				</View>
			</RectButton>
		);
	}

	renderServices = () => {
		const { servicesHeight } = this.state;
		const { services } = this.props;
		const { length } = Object.values(services);
		const style = {
			overflow: 'hidden',
			height: servicesHeight
		};


		if (length > 3) {
			return (
				<Animated.View style={style}>
					{Object.values(services).map(service => this.renderItem(service))}
				</Animated.View>
			);
		}
		return (
			<View>
				{Object.values(services).map(service => this.renderItem(service))}
			</View>
		);
	}

	render() {
		return (
			<ScrollView style={[sharedStyles.containerScrollView, sharedStyles.container, styles.container]} {...scrollPersistTaps}>
				<SafeAreaView testID='welcome-view' forceInset={{ bottom: 'never' }} style={styles.safeArea}>
					{this.renderServices()}
					{this.renderServicesSeparator()}
					<Button
						title={<Text>{I18n.t('Login_with')} <Text style={{ ...sharedStyles.textBold }}>{I18n.t('email')}</Text></Text>}
						type='primary'
						onPress={() => this.login()}
						testID='welcome-view-login'
					/>
					<Button
						title={I18n.t('Create_account')}
						type='secondary'
						onPress={() => this.register()}
						testID='welcome-view-register'
					/>
				</SafeAreaView>
			</ScrollView>
		);
	}
}
