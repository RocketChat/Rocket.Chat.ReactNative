import React, { Component } from 'react';
import {
	I18nManager, Text, View, StyleSheet, SectionList, Switch
} from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';
import { RectButton } from 'react-native-gesture-handler';
import { DrawerButton } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import { showButtomToast } from '../../utils/info';
import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { CustomIcon } from '../../lib/Icons';
import {
	COLOR_TEXT_DESCRIPTION, COLOR_SEPARATOR, COLOR_WHITE, COLOR_BORDER, COLOR_TEXT
} from '../../constants/colors';

const styles = StyleSheet.create({
	contentContainer: {
		paddingBottom: 30
	},
	container: {
		flex: 1,
		backgroundColor: '#F6F7F9'
	},
	sectionItemName: {
		flex: 1,
		fontSize: 14,
		marginStart: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	sectionItem: {
		backgroundColor: COLOR_WHITE,
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	sectionItemDisabled: {
		opacity: 0.3
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR
	},
	sectionSeparatorBorder: {
		borderColor: COLOR_BORDER,
		borderTopWidth: 10
	},
	iconStyle: {
		transform: [{ rotate: I18nManager.isRTL ? '90deg' : '270deg' }],
		alignSelf: 'baseline',
		marginEnd: 20
	}
});

const renderSeparator = () => <View style={styles.separator} />;

export default class SettingsView extends Component {
    static navigationOptions = ({ navigation }) => ({
		headerLeft: <DrawerButton navigation={navigation} />,
		title: I18n.t('Settings')
	})

	static propTypes = {
		navigation: PropTypes.object
	}

	sections() {
		const settings = [
			{
				data: [
					{
						withScreen: true,
						title: 'Contact us',
						screen: 'comming Soon',
						isDeveloped: false
					}, {
						withScreen: true,
						title: 'Language',
						screen: 'LanguageView',
						isDeveloped: true
					}, {
						withScreen: true,
						title: 'Theme',
						screen: 'comming Soon',
						isDeveloped: false
					}, {
						withScreen: true,
						title: 'Share this app',
						screen: 'comming Soon',
						isDeveloped: false
					}
				],
				renderItem: this.renderNromalSettingItem
			}, {
				data: [{
					withScreen: true,
					title: 'License',
					screen: 'comming Soon',
					isDeveloped: false
				}, {
					withScreen: false,
					title: 'Version: 3.4.1 (250)',
					screen: 'comming Soon ',
					isDeveloped: false
				}, {
					withScreen: false,
					title: 'Server version: 1.0.0-develop',
					screen: 'comming Soon ',
					isDeveloped: false
				}
				],
				renderItem: this.renderNromalSettingItem
			},
			{
				data: [{
					title: 'Send crash report',
					screen: 'comming Soon',
					isDeveloped: false,
					withToggleButton: true
				},
				{
					title: 'We never track the content of your chats. The crash report only contains relevant infromation for us in order ',
					screen: 'comming Soon',
					isDeveloped: false,
					disable: true
				}],
				renderItem: this.renderLastSection
			}
		];
		return settings;
	}

	renderSectionSeparator = () => <View style={styles.sectionSeparatorBorder} />;

	renderNromalSettingItem = ({ item }) => {
		const { navigation }= this.props;
		const { navigate } = navigation;
		return (
			<RectButton
				onPress={item.withScreen ? (() => (item.isDeveloped ? navigate(item.screen, {}) : showButtomToast('Comming Soon'))) : null}
				activeOpacity={0.9}
				underlayColor={COLOR_TEXT}
			>
				<View style={styles.sectionItem}>
					<Text style={styles.sectionItemName}>{item.title}</Text>
					{item.withScreen ? <CustomIcon style={styles.iconStyle} name='arrow-down' size={20} color={COLOR_TEXT_DESCRIPTION} /> : null}
				</View>
			</RectButton>
		);
	}

	renderLastSection = ({ item }) => (
		<View style={[styles.sectionItem, item.disable && styles.sectionItemDisabled]}>
			<Text style={styles.sectionItemName}>{item.title}</Text>
			{item.withToggleButton ? <Switch value={false} /> : null}
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
			</SafeAreaView>
		);
	}
}
