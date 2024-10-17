import { StyleSheet } from "react-native";

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
	}
});

export default styles;