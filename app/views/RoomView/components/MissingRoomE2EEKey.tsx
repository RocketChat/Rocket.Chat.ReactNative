import React, { ReactElement } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import { CustomIcon } from '../../../containers/CustomIcon';
import Button from '../../../containers/Button';
import sharedStyles from '../../Styles';
import I18n from '../../../i18n';
import { LEARN_MORE_E2EE_URL } from '../../../lib/encryption';

const GAP = 32;

export const MissingRoomE2EEKey = (): ReactElement => {
	const { colors } = useTheme();
	const styles = useStyle();
	return (
		<View style={styles.root}>
			<View style={styles.container}>
				<View style={styles.textView}>
					<View style={styles.icon}>
						<CustomIcon name='clock' size={42} color={colors.fontSecondaryInfo} />
					</View>
					<Text style={styles.title}>{I18n.t('missing_room_e2ee_title')}</Text>
					<Text style={styles.description}>{I18n.t('missing_room_e2ee_description')}</Text>
				</View>
				<Button
					title={I18n.t('Learn_more')}
					type='secondary'
					backgroundColor={colors.surfaceTint}
					onPress={() => Linking.openURL(LEARN_MORE_E2EE_URL)}
				/>
			</View>
		</View>
	);
};

const useStyle = () => {
	const { colors } = useTheme();
	const styles = StyleSheet.create({
		root: {
			flex: 1,
			backgroundColor: colors.surfaceRoom
		},
		container: {
			flex: 1,
			marginHorizontal: 24,
			justifyContent: 'center'
		},
		textView: { alignItems: 'center' },
		icon: {
			width: 58,
			height: 58,
			borderRadius: 30,
			marginBottom: GAP,
			backgroundColor: colors.surfaceNeutral,
			alignItems: 'center',
			justifyContent: 'center'
		},
		title: {
			...sharedStyles.textBold,
			fontSize: 24,
			lineHeight: 32,
			textAlign: 'center',
			color: colors.fontTitlesLabels,
			marginBottom: GAP
		},
		description: {
			...sharedStyles.textRegular,
			fontSize: 16,
			lineHeight: 24,
			textAlign: 'center',
			color: colors.fontDefault,
			marginBottom: GAP
		}
	});
	return styles;
};
