import React from 'react';
import {
	StyleSheet, View, Text
} from 'react-native';
import ShareExtension from 'rn-extensions-share';

import { CloseShareExtensionButton } from '../containers/HeaderButton';
import sharedStyles from './Styles';
import I18n from '../i18n';
import { COLOR_WHITE } from '../constants/colors';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_WHITE,
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: 18,
		...sharedStyles.textBold,
		...sharedStyles.textColorNormal
	},
	content: {
		fontSize: 14,
		...sharedStyles.textAlignCenter,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	}
});

export default class WithoutServerView extends React.Component {
	static navigationOptions = () => ({
		headerLeft: (
			<CloseShareExtensionButton
				onPress={ShareExtension.close}
				testID='share-extension-close'
			/>
		)
	})

	render() {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>{I18n.t('Without_Servers')}</Text>
				<Text style={styles.content}>{I18n.t('You_need_to_access_at_least_one_RocketChat_server_to_share_something')}</Text>
			</View>
		);
	}
}
