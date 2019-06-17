import React from 'react';
import { StyleSheet } from 'react-native';

import { CustomIcon } from '../lib/Icons';
import sharedStyles from '../views/Styles';

const styles = StyleSheet.create({
	icon: {
		marginHorizontal: 15,
		...sharedStyles.textColorDescription
	}
});

const Check = React.memo(() => <CustomIcon style={styles.icon} size={22} name='check' />);

export default Check;
