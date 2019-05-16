import React, { Component } from 'react';
import {
	Text, View, SectionList, Switch
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import { RectButton } from 'react-native-gesture-handler';
import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { Toast } from '../../utils/info';
import { getReadableVersion } from '../../utils/deviceInfo';
import I18n from '../../i18n';
import styles from './styles';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_TEXT_DESCRIPTION, COLOR_TEXT } from '../../constants/colors';

const renderSeparator = () => <View style={styles.separator} />;
const COMING_SOON = 'coming soon';

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

	sections() {
		const { server } =	this.props;
		return [
			{
				data: [
					{
						withScreen: true,
						title: I18n.t('Contact_us'),
						screen: COMING_SOON,
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
					withScreen: true,
					title: I18n.t('License'),
					screen: COMING_SOON,
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
	}

	renderSectionSeparator = () => <View style={styles.sectionSeparatorBorder} />;

	renderNormalSettingItem = ({ item }) => {
		const { navigation } = this.props;
		const { navigate } = navigation;
		const onPress = (() => {
			if (item.withScreen) {
				if (item.isDeveloped) {
					return () => (navigate(item.screen, {}));
				}
				return () => this.toast.show(COMING_SOON);
			}
			return null;
		})();
		return (
			<RectButton
				onPress={onPress}
				activeOpacity={0.9}
				underlayColor={COLOR_TEXT}
			>
				<View style={styles.sectionItem}>
					<View style={{ flex: 1 }}>
						<Text style={styles.sectionItemTitle}>{item.title}</Text>
						{item.subTitle
							? <Text style={styles.sectionItemSubTitle}>{item.subTitle}</Text>
							: null
						}
					</View>
					{item.withScreen ? <CustomIcon style={styles.iconStyle} name='arrow-down' size={20} color={COLOR_TEXT_DESCRIPTION} /> : null}
				</View>
			</RectButton>
		);
	}

	renderLastSection = ({ item }) => (
		<View style={[styles.sectionItem, item.disable && styles.sectionItemDisabled]}>
			<View style={{ flex: 1 }}>
				<Text style={{ ...styles.sectionItemTitle, marginTop: 5 }}>{item.title}</Text>
			</View>
			{item.withToggleButton ? <Switch value={false} style={{ marginStart: 5 }} /> : null}
		</View>
	)

	render() {
		return (
			<SafeAreaView style={styles.container} forceInset={{ bottom: 'never' }}>
				<StatusBar />
				<SectionList
					contentContainerStyle={styles.contentContainer}
					style={styles.container}
					stickySectionHeadersEnabled={false}
					sections={this.sections()}
					SectionSeparatorComponent={this.renderSectionSeparator}
					ItemSeparatorComponent={renderSeparator}
					keyExtractor={item => item.title}
				/>
				<Toast ref={toast => this.toast = toast} />
			</SafeAreaView>
		);
	}
}
