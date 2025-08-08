import { StyleSheet } from 'react-native';

import sharedStyles from '../../../Styles';

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
		textAlign: 'center',
		lineHeight: 20
	}
});

export default styles;
