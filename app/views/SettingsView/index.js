import React, { Component } from 'react';
import {
	Text, View, Switch, Linking, ScrollView
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import { RectButton } from 'react-native-gesture-handler';

import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { Toast } from '../../utils/info';
import { getReadableVersion, getDeviceModel } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import styles from './styles';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_TEXT_DESCRIPTION, COLOR_TEXT } from '../../constants/colors';
import openLink from '../../utils/openLink';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import DisclosureIndicator from '../../containers/DisclosureIndicator';

const LICENSE_LINK = 'https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/LICENSE';

@connect(state => ({ server: state.server }))

export default class SettingsView extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Settings')
	});

	static propTypes = {
		navigation: PropTypes.object,
		server:	PropTypes.object
	}

	/* sections() {
		const { server } =	this.props;
		return [
			{
				data: [
					{
						withScreen: false,
						title: I18n.t('Contact_us'),
						action: ACTIONS.SEND_EMAIL,
						isDeveloped: false
					}, {
						withScreen: true,
						title: I18n.t('Language'),
						screen: 'LanguageView',
						isDeveloped: true
					}, {
						withScreen: true,
						title: I18n.t('Theme'),
						screen: COMING_SOON,
						isDeveloped: false
					}, {
						withScreen: true,
						title: I18n.t('Share_this_app'),
						screen: COMING_SOON,
						isDeveloped: false
					}
				],
				renderItem: this.renderNormalSettingItem
			}, {
				data: [{
					withScreen: false,
					title: I18n.t('License'),
					action: ACTIONS.OPEN_LINK,
					subTitle: '',
					isDeveloped: false
				}, {
					withScreen: false,
					title: I18n.t('Version_no', { version: getReadableVersion }),
					subTitle: '',
					isDeveloped: false
				}, {
					withScreen: false,
					title: I18n.t('Server_version', { version: server.version }),
					subTitle: `${ server.server.split('//')[1] }`,
					isDeveloped: false
				}
				],
				renderItem: this.renderNormalSettingItem
			},
			{
				data: [{
					title: I18n.t('Send_crash_report'),
					screen: COMING_SOON,
					isDeveloped: false,
					withToggleButton: true
				},
				{
					title: I18n.t('Crash_report_disclaimer'),
					screen: COMING_SOON,
					isDeveloped: false,
					disable: true
				}],
				renderItem: this.renderLastSection
			}
		];
	} */
	navigateToRoom = (room) => {
		const { navigation } = this.props;
		return () => navigation.navigate(room);
	}

	sendEmail = () => {
		const subject = encodeURI('React Native App Support');
		const email = encodeURI('support@rocket.chat');
		const description = encodeURI(`
			version: ${ getReadableVersion }
			device: ${ getDeviceModel }
		`);
		Linking.openURL(`mailto:${ email }?subject=${ subject }&body=${ description }`);
	}

	openLink = link => () => openLink(link)

	renderSectionSeparator = () => <View style={styles.sectionSeparatorBorder} />;

	renderSeparator = () => <View style={styles.separator} />;

	renderItem = (item) => {
		if (!item.onPress) {
			item.onPress = () => {};
		}
		return (
			<React.Fragment>
				<RectButton
					onPress={item.onPress}
					activeOpacity={0.9}
					underlayColor={COLOR_TEXT}
				>
					<View style={[styles.sectionItem, item.disable && styles.sectionItemDisabled]}>
						<View>
							<Text style={styles.sectionItemTitle}>{item.title}</Text>
							{item.subTitle
								? <Text style={styles.sectionItemSubTitle}>{item.subTitle}</Text>
								: null
							}
						</View>
						{item.showActionIndicator ? <DisclosureIndicator /> : null}
					</View>
				</RectButton>
				{this.renderSeparator()}
			</React.Fragment>
		);
	}

	renderItemSwitch = item => (
		<React.Fragment>
			<View style={[styles.sectionItem, item.disable && styles.sectionItemDisabled]}>
				<View>
					<Text style={styles.sectionItemTitle}>{item.title}</Text>
					{item.subTitle
						? <Text style={styles.sectionItemSubTitle}>{item.subTitle}</Text>
						: null
					}
				</View>
				<Switch value={false} disabled={item.disable} style={styles.switch} />
			</View>
			{this.renderSeparator()}
		</React.Fragment>
	)

	render() {
		const { server } = this.props;
		return (
			<SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={styles.contentContainer}
				>
					{this.renderSectionSeparator()}

					{this.renderItem({ title: I18n.t('Contact_us'), onPress: this.sendEmail, showActionIndicator: true })}
					{this.renderItem({ title: I18n.t('Language'), onPress: this.navigateToRoom('LanguageView'), showActionIndicator: true })}
					{this.renderItem({ title: I18n.t('Theme'), showActionIndicator: true, disable: true })}
					{this.renderItem({ title: I18n.t('Share_this_app'), showActionIndicator: true, disable: true })}
					{this.renderItem({ title: I18n.t('Theme'), showActionIndicator: true, disable: true })}

					{this.renderSectionSeparator()}

					{this.renderItem({ title: I18n.t('License'), onPress: this.openLink(LICENSE_LINK), showActionIndicator: true })}
					{this.renderItem({ title: I18n.t('Version_no', { version: getReadableVersion }) })}
					{this.renderItem({ title: I18n.t('Server_version', { version: server.version }), subTitle: `${ server.server.split('//')[1] }` })}

					{this.renderSectionSeparator()}

					{this.renderItemSwitch({ title: I18n.t('Send_crash_report'), disable: true })}
					{this.renderItem({ title: I18n.t('Crash_report_disclaimer'), disable: true })}
				</ScrollView>
			</SafeAreaView>
		);
	}
}
