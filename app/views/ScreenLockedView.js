import React from 'react';
import {
	View, Text, StyleSheet, ActivityIndicator
} from 'react-native';
import { connect } from 'react-redux';

import { appInit as appInitAction } from '../actions';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';

import sharedStyles from './Styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	text: {
		fontSize: 16,
		paddingTop: 10,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

const ScreenLockedView = React.memo(withTheme(({ theme, appInit }) => {
	return (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
			<StatusBar theme={theme} />
			<Text style={[styles.text, { color: themes[theme].bodyText }]}>App locked</Text>
			<Text style={[styles.text, { color: themes[theme].tintColor }]} onPress={appInit}>Unlock with touchid</Text>
		</View>
	);
}));

const mapDispatchToProps = dispatch => ({
	appInit: () => dispatch(appInitAction())
});

export default connect(null, mapDispatchToProps)(withTheme(ScreenLockedView));
