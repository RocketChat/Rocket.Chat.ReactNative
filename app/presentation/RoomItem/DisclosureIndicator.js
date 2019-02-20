import React from 'react';
import { View, Image } from 'react-native';

import styles from './styles';
import { isIOS } from '../../utils/deviceInfo';

const DisclosureIndicator = React.memo(() => {
	if (isIOS) {
		return (
			<View style={styles.disclosureContainer}>
				<Image source={{ uri: 'disclosure_indicator' }} style={styles.disclosureIndicator} />
			</View>
		);
	}
	return <View style={styles.emptyDisclosureAndroid} />;
});

export default DisclosureIndicator;
