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
		...sharedStyles.textRegular,
		fontSize: 13,
		textAlign: 'center'
	},
	bottomContainerTextBold: {
		...sharedStyles.textSemibold,
		fontSize: 13,
		textAlign: 'center'
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
			<Text style={[styles.bottomContainerText, { color: colors.fontSecondaryInfo }]}>
				{`${I18n.t('Onboarding_agree_terms')}\n`}
				<Text
					style={[styles.bottomContainerTextBold, { color: colors.strokeHighlight }]}
					onPress={() => openContract('terms-of-service')}
				>
					{I18n.t('Terms_of_Service')}
				</Text>{' '}
				{I18n.t('and')}
				<Text
					style={[styles.bottomContainerTextBold, { color: colors.strokeHighlight }]}
					onPress={() => openContract('privacy-policy')}
				>
					{' '}
					{I18n.t('Privacy_Policy')}
				</Text>
			</Text>
		</View>
	);
};

export default UGCRules;
