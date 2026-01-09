import React from 'react';
import { View, StyleSheet, Text, type ViewStyle } from 'react-native';

import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';
import openLink from '../lib/methods/helpers/openLink';
import { useAppSelector } from '../lib/hooks/useAppSelector';
import I18n from '../i18n';
import { useResponsiveLayout } from '../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const styles = StyleSheet.create({
	bottomContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		marginBottom: 32,
		marginHorizontal: 30
	},
	bottomContainerText: {
		...sharedStyles.textMedium,
		textAlign: 'center'
	},
	bottomContainerTextUnderline: {
		textDecorationLine: 'underline'
	}
});

const UGCRules = ({ styleContainer }: { styleContainer?: ViewStyle }) => {
	const { colors, theme } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
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
			<Text style={[styles.bottomContainerText, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(14), lineHeight: scaleFontSize(22) }]}>{I18n.t('Onboarding_agree_terms')}</Text>
			<Text
				style={[styles.bottomContainerTextUnderline, styles.bottomContainerText, { color: colors.fontInfo, fontSize: scaleFontSize(14), lineHeight: scaleFontSize(22) }]}
				onPress={() => openContract('terms-of-service')}>
				{I18n.t('Terms_of_Service')}
			</Text>
			<Text
				style={[styles.bottomContainerTextUnderline, styles.bottomContainerText, { color: colors.fontInfo, fontSize: scaleFontSize(14), lineHeight: scaleFontSize(22) }]}
				onPress={() => openContract('privacy-policy')}>
				{I18n.t('Privacy_Policy')}
			</Text>
		</View>
	);
};

export default UGCRules;
