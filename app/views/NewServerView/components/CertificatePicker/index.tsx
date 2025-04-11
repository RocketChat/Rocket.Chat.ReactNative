import React from 'react';
import { Text, StyleSheet } from 'react-native';

import I18n from '../../../../i18n';
import { TCertificatePicker } from '../../definitions';
import Button from '../../../../containers/Button';
import sharedStyles from '../../../Styles';
import { useTheme } from '../../../../theme';

const styles = StyleSheet.create({
	certificatePicker: {
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	chooseCertificateTitle: {
		...sharedStyles.textRegular
	},
	chooseCertificate: {
		...sharedStyles.textSemibold
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
		<>
			<Text style={[styles.buttonPrompt, { color: colors.fontSecondaryInfo }]}>
				{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
			</Text>
			<Button
				onPress={certificate ? handleRemove : chooseCertificate}
				testID='new-server-choose-certificate'
				title={certificate ?? I18n.t('Apply_Certificate')}
				type='secondary'
				disabled={connecting}
				style={{ marginTop: 12, marginBottom: 24 }}
				fontSize={12}
				styleText={styles.chooseCertificateTitle}
				small
			/>
		</>
	);
};

export default CertificatePicker;
