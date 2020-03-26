import React from 'react';
import { Text, ScrollView, Keyboard, Image, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';

import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import KeyboardView from '../presentation/KeyboardView';
import StatusBar from './StatusBar';
import AppVersion from './AppVersion';

const styles = StyleSheet.create({
	title: {
		...sharedStyles.textBold,
		fontSize: 22,
		letterSpacing: 0,
		textAlign: 'auto'
	},
	inputContainer: {
		marginTop: 24,
		marginBottom: 32
	},
	backButton: {
		position: 'absolute',
		paddingHorizontal: 9,
		left: 15
	},
	certificatePicker: {
		flex: 1,
		marginTop: 40,
		alignItems: 'center',
		justifyContent: 'center'
	},
	chooseCertificateTitle: {
		fontSize: 15,
		...sharedStyles.textRegular
	},
	chooseCertificate: {
		fontSize: 15,
		...sharedStyles.textSemibold
	}
});

const FormContainer = ({ children, theme }) => (
	<KeyboardView
		style={{ backgroundColor: themes[theme].backgroundColor }}
		contentContainerStyle={sharedStyles.container}
		keyboardVerticalOffset={128}
		// key='login-view'
	>
		<StatusBar theme={theme} />
		<ScrollView {...scrollPersistTaps} style={sharedStyles.container} contentContainerStyle={[sharedStyles.containerScrollView, { height: '100%' }]}>
			<SafeAreaView style={sharedStyles.container} testID='new-server-view'>
				{children}
			</SafeAreaView>
			<AppVersion theme={theme} />
		</ScrollView>
	</KeyboardView>
);

FormContainer.propTypes = {
	theme: PropTypes.string
};

export default FormContainer;
