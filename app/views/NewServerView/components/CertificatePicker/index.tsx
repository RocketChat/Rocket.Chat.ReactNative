import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import I18n from 'i18n-js';

import { themes } from '../../../../lib/constants';
import { TCertificatePicker } from '../../definitions';
import { isAndroid, isTablet } from '../../../../lib/methods/helpers';
import styles from './styles';

const CertificatePicker = ({ previousServer, certificate, theme, chooseCertificate, handleRemove }: TCertificatePicker) => (
	<View
		style={[
			styles.certificatePicker,
			{
				marginTop: isAndroid ? 20 : 0,
				marginBottom: previousServer && !isTablet ? 10 : 30
			}
		]}>
		<Text style={[styles.chooseCertificateTitle, { color: themes[theme].fontSecondaryInfo, fontSize: 13 }]}>
			{certificate ? I18n.t('Your_certificate') : I18n.t('Do_you_have_a_certificate')}
		</Text>
		<TouchableOpacity onPress={certificate ? handleRemove : chooseCertificate} testID='new-server-choose-certificate'>
			<Text style={[styles.chooseCertificate, { color: themes[theme].fontInfo, fontSize: 13 }]}>
				{certificate ?? I18n.t('Apply_Your_Certificate')}
			</Text>
		</TouchableOpacity>
	</View>
);

export default CertificatePicker;
