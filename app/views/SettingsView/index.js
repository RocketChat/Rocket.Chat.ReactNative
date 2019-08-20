import React from 'react';
import {
	View, Linking, ScrollView, AsyncStorage, SafeAreaView, Switch, Share
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { toggleMarkdown as toggleMarkdownAction } from '../../actions/markdown';
import { SWITCH_TRACK_COLOR } from '../../constants/colors';
import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import ListItem from '../../containers/ListItem';
import { DisclosureImage } from '../../containers/DisclosureIndicator';
import Separator from '../../containers/Separator';
import I18n from '../../i18n';
import { MARKDOWN_KEY } from '../../lib/rocketchat';
import { getReadableVersion, getDeviceModel, isAndroid } from '../../utils/deviceInfo';
import openLink from '../../utils/openLink';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert } from '../../utils/info';
import styles from './styles';
import sharedStyles from '../Styles';
import { PLAY_MARKET_LINK, APP_STORE_LINK, LICENSE_LINK } from '../../constants/links';

const SectionSeparator = React.memo(() => <View style={styles.sectionSeparatorBorder} />);

class SettingsView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Settings')
	});

	static propTypes = {
		navigation: PropTypes.object,
		server:	PropTypes.object,
		useMarkdown: PropTypes.bool,
		toggleMarkdown: PropTypes.func
	}

	toggleMarkdown = (value) => {
		AsyncStorage.setItem(MARKDOWN_KEY, JSON.stringify(value));
		const { toggleMarkdown } = this.props;
		toggleMarkdown(value);
	}

	navigateToRoom = (room) => {
		const { navigation } = this.props;
		navigation.navigate(room);
	}

	sendEmail = async() => {
		const subject = encodeURI('React Native App Support');
		const email = encodeURI('support@rocket.chat');
		const description = encodeURI(`
			version: ${ getReadableVersion }
			device: ${ getDeviceModel }
		`);
		try {
			await Linking.openURL(`mailto:${ email }?subject=${ subject }&body=${ description }`);
		} catch (e) {
			showErrorAlert(I18n.t('error-email-send-failed', { message: 'support@rocket.chat' }));
		}
	}

	shareApp = () => {
		Share.share({ message: isAndroid ? PLAY_MARKET_LINK : APP_STORE_LINK });
	}

	onPressLicense = () => openLink(LICENSE_LINK)

	renderDisclosure = () => <DisclosureImage />

	renderMarkdownSwitch = () => {
		const { useMarkdown } = this.props;
		return (
			<Switch
				value={useMarkdown}
				trackColor={SWITCH_TRACK_COLOR}
				onValueChange={this.toggleMarkdown}
			/>
		);
	}

	render() {
		const { server } = this.props;
		return (
			<SafeAreaView style={sharedStyles.listSafeArea} testID='settings-view'>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={sharedStyles.listContentContainer}
					showsVerticalScrollIndicator={false}
					testID='settings-view-list'
				>
					<ListItem
						title={I18n.t('Contact_us')}
						onPress={this.sendEmail}
						showActionIndicator
						testID='settings-view-contact'
						right={this.renderDisclosure}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Language')}
						onPress={() => this.navigateToRoom('LanguageView')}
						showActionIndicator
						testID='settings-view-language'
						right={this.renderDisclosure}
					/>
					<Separator />
					<ListItem
						title={I18n.t('Share_this_app')}
						onPress={this.shareApp}
						showActionIndicator
						testID='settings-view-share-app'
					/>
					<Separator />
					<ListItem
						title={I18n.t('Theme')}
						showActionIndicator
						disabled
						testID='settings-view-theme'
					/>
					<Separator />

					<SectionSeparator />

					<ListItem
						title={I18n.t('License')}
						onPress={this.onPressLicense}
						showActionIndicator
						testID='settings-view-license'
						right={this.renderDisclosure}
					/>
					<Separator />
					<ListItem title={I18n.t('Version_no', { version: getReadableVersion })} testID='settings-view-version' />
					<Separator />
					<ListItem
						title={I18n.t('Server_version', { version: server.version })}
						subtitle={`${ server.server.split('//')[1] }`}
						testID='settings-view-server-version'
					/>

					<SectionSeparator />

					<ListItem
						title={I18n.t('Enable_markdown')}
						testID='settings-view-markdown'
						right={() => this.renderMarkdownSwitch()}
					/>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server,
	useMarkdown: state.markdown.useMarkdown
});

const mapDispatchToProps = dispatch => ({
	toggleMarkdown: params => dispatch(toggleMarkdownAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(SettingsView);
