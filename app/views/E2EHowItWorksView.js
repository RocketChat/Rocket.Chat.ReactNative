import React from 'react';
import PropTypes from 'prop-types';
import { Text, StyleSheet } from 'react-native';

import SafeAreaView from '../containers/SafeAreaView';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import sharedStyles from './Styles';
import I18n from '../i18n';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 44,
		paddingTop: 32
	},
	info: {
		fontSize: 14,
		marginVertical: 8,
		...sharedStyles.textRegular
	}
});

class E2EHowItWorksView extends React.Component {
	static navigationOptions = ({
		title: I18n.t('How_It_Works')
	})

	static propTypes = {
		theme: PropTypes.string
	}

	render() {
		const { theme } = this.props;

		return (
			<SafeAreaView
				style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}
				testID='e2e-how-it-works-view'
				theme={theme}
			>
				<Text style={[styles.info, { color: themes[theme].bodyText }]}>You can now create encrypted private groups and direct messages. You may also change existing private groups or DMs to encrypted.</Text>
				<Text style={[styles.info, { color: themes[theme].bodyText }]}>This is <Text style={sharedStyles.textBold}>end to end encryption</Text> so the key to encode/decode your messages and they will not be saved on the server. For that reason <Text style={sharedStyles.textBold}>you need to store this password somewhere safe</Text> which you can access later if you may need.</Text>
				<Text style={[styles.info, { color: themes[theme].bodyText }]}>If you proceed, it will be auto generated an E2E password.</Text>
				<Text style={[styles.info, { color: themes[theme].bodyText }]}>You can also setup a new password for your encryption key any time from any browser you have entered the existing E2E password.</Text>
			</SafeAreaView>
		);
	}
}

export default withTheme(E2EHowItWorksView);
