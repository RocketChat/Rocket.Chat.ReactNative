import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';

import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';
import openLink from '../lib/methods/helpers/openLink';
import { useAppSelector } from '../lib/hooks';
import I18n from '../i18n';

const styles = StyleSheet.create({
	bottomContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		marginBottom: 32,
		marginHorizontal: 30
	},
	bottomContainerText: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 22,
		textAlign: 'center'
	},
	bottomContainerTextUnderline: {
		textDecorationLine: 'underline'
	}
});

const UGCRules = ({ styleContainer }: { styleContainer?: ViewStyle }) => {
	const { colors, theme } = useTheme();
	const { server } = useAppSelector(state => ({
		server: state.server.server
	}));

	const openContract = (route: string) => {
		if (!server) {
			return;
		}
		openLink(`${server}/${route}`, theme);
	};
	return (
		<View style={[styles.bottomContainer, styleContainer]}>
			<Text style={[styles.bottomContainerText, { color: colors.fontSecondaryInfo }]}>{I18n.t('Onboarding_agree_terms')}</Text>
			<Text
				style={[styles.bottomContainerTextUnderline, styles.bottomContainerText, { color: colors.fontInfo }]}
				onPress={() => openContract('terms-of-service')}>
				{I18n.t('Terms_of_Service')}
			</Text>
			<Text
				style={[styles.bottomContainerTextUnderline, styles.bottomContainerText, { color: colors.fontInfo }]}
				onPress={() => openContract('privacy-policy')}>
				{I18n.t('Privacy_Policy')}
			</Text>
		</View>
	);
};

export default UGCRules;
