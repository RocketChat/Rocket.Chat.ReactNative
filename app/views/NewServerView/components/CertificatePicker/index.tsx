import React from 'react';
import { Text } from 'react-native';

import I18n from '../../../../i18n';
import { TCertificatePicker } from '../../definitions';
import styles from './styles';
import Button from '../../../../containers/Button';
import { useTheme } from '../../../../theme';

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
