import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import SafeAreaView from '../containers/SafeAreaView';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import I18n from '../i18n';

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
				style={{ backgroundColor: themes[theme].backgroundColor }}
				testID='e2e-how-it-works-view'
				theme={theme}
			>
				<Text>You can now create encrypted private groups and direct messages. You may also change existing private groups or DMs to encrypted. This is end to end encryption so the key to encode/decode your messages and they will not be saved on the server. For that reason you need to store this password somewhere safe which you can access later if you may need. If you proceed, it will be auto generated an E2E password.You can also setup a new password for your encryption key any time from any browser you have entered the existing E2E password.</Text>
			</SafeAreaView>
		);
	}
}

export default withTheme(E2EHowItWorksView);
