import React from 'react';
import {
	View, Image, StyleSheet, I18nManager
} from 'react-native';

const styles = StyleSheet.create({
	disclosureContainer: {
		transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
		marginLeft: 6,
		marginRight: 9,
		alignItems: 'center',
		justifyContent: 'center'
	},
	disclosureIndicator: {
		width: 20,
		height: 20
	}
});

const DisclosureIndicator = React.memo(() => (
	<View style={styles.disclosureContainer}>
		<Image source={{ uri: 'disclosure_indicator' }} style={styles.disclosureIndicator} />
	</View>
));
export default DisclosureIndicator;
