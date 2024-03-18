import React, { useLayoutEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ShareExtension from 'rn-extensions-share';
import { useNavigation } from '@react-navigation/native';

import * as HeaderButton from '../containers/HeaderButton';
import I18n from '../i18n';
import { useTheme } from '../theme';
import sharedStyles from './Styles';

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
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	}
});

const WithoutServerView = (): React.ReactElement => {
	const navigation = useNavigation();
	const { colors } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: 'Rocket.Chat',
			headerLeft: () => <HeaderButton.CancelModal onPress={ShareExtension.close} testID='share-extension-close' />
		});
	}, [navigation]);

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceRoom }]}>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('Without_Servers')}</Text>
			<Text style={[styles.content, { color: colors.fontTitlesLabels }]}>
				{I18n.t('You_need_to_access_at_least_one_RocketChat_server_to_share_something')}
			</Text>
		</View>
	);
};

export default WithoutServerView;
