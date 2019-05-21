import React, { Component } from 'react';
import {
	Text, View, Switch, Linking, ScrollView, AsyncStorage
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import { RectButton } from 'react-native-gesture-handler';
import { Answers } from 'react-native-fabric';

import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { getReadableVersion, getDeviceModel, isAndroid } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import { MARKDOWN_KEY } from '../../lib/rocketchat';
import styles from './styles';
import { COLOR_SUCCESS, COLOR_TEXT, COLOR_DANGER } from '../../constants/colors';
import openLink from '../../utils/openLink';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import DisclosureIndicator from '../../containers/DisclosureIndicator';
import { toggleMarkdown as toggleMarkdownAction } from '../../actions/markdown';

const LICENSE_LINK = 'https://github.com/RocketChat/Rocket.Chat.ReactNative/blob/develop/LICENSE';

@connect(state => ({
	server: state.server,
	useMarkdown: state.markdown.useMarkdown
}), dispatch => ({
	toggleMarkdown: params => dispatch(toggleMarkdownAction(params))
}))

export default class SettingsView extends Component {
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
		Answers.logCustom('toggle_markdown', { value });
	}

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
				<Switch
					value={item.value}
					disabled={item.disable}
					style={styles.switch}
					trackColor={{
						false: isAndroid ? COLOR_DANGER : null,
						true: COLOR_SUCCESS
					}}
					onValueChange={item.onValueChange}
				/>
			</View>
			{this.renderSeparator()}
		</React.Fragment>
	)

	render() {
		const { server, useMarkdown } = this.props;
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

					{this.renderItemSwitch({ title: I18n.t('Enable_markdown'), value: useMarkdown, onValueChange: this.toggleMarkdown })}
					{this.renderItemSwitch({ title: I18n.t('Send_crash_report'), disable: true })}
					{this.renderItem({ title: I18n.t('Crash_report_disclaimer'), disable: true })}
				</ScrollView>
			</SafeAreaView>
		);
	}
}
