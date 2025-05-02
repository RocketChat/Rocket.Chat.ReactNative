import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

import I18n from '../../../../i18n';
import { TCertificatePicker } from '../../definitions';
import Button from '../../../../containers/Button';
import sharedStyles from '../../../Styles';
import { useTheme } from '../../../../theme';

const styles = StyleSheet.create({
	container: {
		paddingTop: 12,
		paddingBottom: 24,
		rowGap: 12
	},
	button: {
		marginTop: 0,
		marginBottom: 0
	},
	chooseCertificateTitle: {
		...sharedStyles.textBold
	},
	buttonPrompt: {
		...sharedStyles.textRegular,
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20
	}
});

const CertificatePicker = ({ connecting, certificate, chooseCertificate, handleRemove, showBottomInfo }: TCertificatePicker) => {
	const { colors } = useTheme();
	if (!showBottomInfo) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Text style={[styles.buttonPrompt, { color: colors.fontSecondaryInfo }]}>
				{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
			</Text>
			<Button
				onPress={certificate ? handleRemove : chooseCertificate}
				testID='new-server-choose-certificate'
				title={certificate ?? I18n.t('Apply_Certificate')}
				type='secondary'
				disabled={connecting}
				style={styles.button}
				fontSize={12}
				styleText={styles.chooseCertificateTitle}
				small
			/>
		</View>
	);
};

export default CertificatePicker;
