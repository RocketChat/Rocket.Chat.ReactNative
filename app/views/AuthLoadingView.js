import React from 'react';
import {
	View, Text, StyleSheet, ActivityIndicator
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

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

const AuthLoadingView = React.memo(({ theme, text }) => (
	<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
		<StatusBar />
		{text && (
			<>
				<ActivityIndicator color={themes[theme].auxiliaryText} size='large' />
				<Text style={[styles.text, { color: themes[theme].bodyText }]}>{`${ text }\n${ I18n.t('Please_wait') }`}</Text>
			</>
		)}
	</View>
));

const mapStateToProps = state => ({
	text: state.app.text
});

AuthLoadingView.propTypes = {
	theme: PropTypes.string,
	text: PropTypes.string
};

export default connect(mapStateToProps)(withTheme(AuthLoadingView));
