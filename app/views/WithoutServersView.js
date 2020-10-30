import React from 'react';
import {
	StyleSheet, View, Text
} from 'react-native';
import PropTypes from 'prop-types';
import ShareExtension from 'rn-extensions-share';

import * as HeaderButton from '../containers/HeaderButton';
import sharedStyles from './Styles';
import I18n from '../i18n';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 15
	},
	title: {
		fontSize: 18,
		...sharedStyles.textBold
	},
	content: {
		fontSize: 14,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textRegular
	}
});

class WithoutServerView extends React.Component {
	static navigationOptions = () => ({
		title: 'Rocket.Chat',
		headerLeft: () => (
			<HeaderButton.CancelModal
				onPress={ShareExtension.close}
				testID='share-extension-close'
			/>
		)
	})

	static propTypes = {
		theme: PropTypes.string
	}

	render() {
		const { theme } = this.props;
		return (
			<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Without_Servers')}</Text>
				<Text style={[styles.content, { color: themes[theme].titleText }]}>{I18n.t('You_need_to_access_at_least_one_RocketChat_server_to_share_something')}</Text>
			</View>
		);
	}
}

export default withTheme(WithoutServerView);
