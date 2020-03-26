import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import PropTypes from 'prop-types';
import { SafeAreaView } from 'react-navigation';

import { themes } from '../constants/colors';
import sharedStyles from '../views/Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import KeyboardView from '../presentation/KeyboardView';
import StatusBar from './StatusBar';
import AppVersion from './AppVersion';
import { isTablet } from '../utils/deviceInfo';

const styles = StyleSheet.create({
	scrollView: {
		height: '100%'
	}
});

const FormContainer = ({ children, theme }) => (
	<KeyboardView
		style={{ backgroundColor: themes[theme].backgroundColor }}
		contentContainerStyle={sharedStyles.container}
		keyboardVerticalOffset={128}
	>
		<StatusBar theme={theme} />
		<ScrollView {...scrollPersistTaps} style={sharedStyles.container} contentContainerStyle={[sharedStyles.containerScrollView, styles.scrollView]}>
			<SafeAreaView style={sharedStyles.container} forceInset={{ top: 'never' }}>
				<View style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]}>
					{children}
				</View>
			</SafeAreaView>
			<AppVersion theme={theme} />
		</ScrollView>
	</KeyboardView>
);

FormContainer.propTypes = {
	theme: PropTypes.string,
	children: PropTypes.element
};

export default FormContainer;
