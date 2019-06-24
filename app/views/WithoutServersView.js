import React from 'react';
import {
	StyleSheet, View, Text, TouchableOpacity
} from 'react-native';
import ShareExtension from 'rn-extensions-share';

import I18n from '../i18n';
import { COLOR_WHITE, HEADER_BACK } from '../constants/colors';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_WHITE,
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold'
	},
	content: {
		fontSize: 14,
		textAlign: 'center'
	},
	closeButton: {
		marginLeft: 16
	},
	close: {
		color: HEADER_BACK,
		fontSize: 16
	}
});

export default class WithoutServerView extends React.Component {
	static navigationOptions = () => ({
		headerLeft: (
			<TouchableOpacity style={styles.closeButton} onPress={() => ShareExtension.close()}>
				<Text style={styles.close}>{I18n.t('Close')}</Text>
			</TouchableOpacity>
		)
	})

	render() {
		return (
			<React.Fragment>
				<View style={styles.container}>
					<Text style={styles.title}>{I18n.t('Without_Servers')}</Text>
					<Text style={styles.content}>{I18n.t('You_need_to_access_at_least_one_RocketChat_server_to_share_something')}</Text>
				</View>
			</React.Fragment>
		);
	}
}
