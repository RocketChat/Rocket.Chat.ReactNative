import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	Text,
	View,
	Modal,
	StyleSheet,
	TouchableOpacity,
	Platform,
	Linking
} from 'react-native';

import SafeAreaView from './SafeAreaView';
import I18n from '../i18n';
import { themes } from '../constants/colors';
import { CloseModalButton } from './HeaderButton';

const styles = StyleSheet.create({
	container: {
		flex: 1
    },
    headerContainer: {
		height: 44,
		width: '100%',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row'
	},
	textHeader: {
		fontSize: 16,
		color: '#fff'
	},
	contentSettingLocation: {
		width: '100%',
		height: '100%',
		flexDirection: 'column',
		padding: 10
	},
	textStep: {
		fontSize: 15,
		padding: 5
	},
	stepOpenLocation: {
		padding: 15
	},
	viewSelectLocation: {
		height: 50,
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center'
	},
	buttonOpenSettingApp: {
		width: '40%',
		height: 35,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#db1d39',
		borderRadius: 20
	},
	headerButton: {
		height: 44,
		width: 44,
		justifyContent: 'center',
		alignItems: 'center'
	}
});

class SettingsTurnOnGPS extends Component {
	static propTypes = {
		isLocationSettings: PropTypes.bool,
		onPressClose: PropTypes.func,
		theme: PropTypes.string,
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		this.watchID = null;
	}

	shouldComponentUpdate(nextProps) {
		const { isLocationSettings, theme } = this.props;
		if (nextProps.isLocationSettings !== isLocationSettings) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		return false;
	}

	allowAccess = () => {
		const { onPressClose } = this.props;
		Linking.openSettings();
		onPressClose();
	}

	renderStepOpenSettings = () => {
		const { theme } = this.props;
		const color = theme === 'light' ? '#000000' : '#fff';
		if (Platform.OS === 'ios') {
			return (
				<>
					<Text style={[styles.textStep, { color }]}>1. {I18n.t('Permission_Step_ios.step1')}</Text>
					<Text style={[styles.textStep, { color }]}>2. {I18n.t('Permission_Step_ios.step2')}</Text>
					<Text style={[styles.textStep, { color }]}>3. {I18n.t('Permission_Step_ios.step3')}</Text>
					<Text style={[styles.textStep, { color }]}>4. {I18n.t('Permission_Step_ios.step4')}</Text>
				</>
			);
		} else {
			return (
				<>
					<Text style={[styles.textStep, { color }]}>1. {I18n.t('Permission_Step_Android.step1')}</Text>
					<Text style={[styles.textStep, { color }]}>2. {I18n.t('Permission_Step_Android.step2')}</Text>
					<Text style={[styles.textStep, { color }]}>3. {I18n.t('Permission_Step_Android.step3')}</Text>
					<Text style={[styles.textStep, { color }]}>4. {I18n.t('Permission_Step_Android.step4')}</Text>
					<Text style={[styles.textStep, { color }]}>4. {I18n.t('Permission_Step_Android.step5')}</Text>
				</>
			);
		}
	}

	renderHeader = () => {
		const { theme, navigation, onPressClose } = this.props;
		return (
			<View style={[styles.headerContainer, { backgroundColor: themes[theme].headerBackground }]}>
				<View style={styles.headerButton}>
					<CloseModalButton onPress={onPressClose} navigation={navigation} />
				</View>
				<View style={{ width: '100%', alignItems: 'center' }}>
					<Text style={[styles.textHeader, { color: themes[theme].headerTitleColor }]}>
						{I18n.t('Choose_Location')}
					</Text>
				</View>
				<View style={styles.headerButton} />
			</View>
		);
	}

	render() {
		const {
			isLocationSettings,
			onPressClose,
			theme
		} = this.props;
		return (
			<SafeAreaView theme={theme}>
				<Modal
					animationType='slide'
					transparent
					visible={isLocationSettings}
					onRequestClose={onPressClose}
				>
					{this.renderHeader()}
					<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
						<View style={styles.contentSettingLocation}>
							<Text style={{ color: themes[theme].bodyText, fontSize: 14 }}>{I18n.t('Request_Permission_Location')}</Text>
							<View style={styles.stepOpenLocation}>
								{this.renderStepOpenSettings()}
								<View style={styles.viewSelectLocation}>
									<TouchableOpacity style={[styles.buttonOpenSettingApp]} activeOpacity={0.7} onPress={this.allowAccess}>
										<Text style={{ color: '#fff', fontSize: 14 }}>{I18n.t('Allow_Access')}</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					</View>
				</Modal>
			</SafeAreaView>
		);
	}
}

export default SettingsTurnOnGPS;
