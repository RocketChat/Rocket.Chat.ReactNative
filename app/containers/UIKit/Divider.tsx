import React from 'react';
import { StyleSheet } from 'react-native';

import * as List from '../List';

const styles = StyleSheet.create({
	separator: {
		width: '100%',
		alignSelf: 'center',
		marginBottom: 16
	}
});

export const Divider = () => <List.Separator style={styles.separator} />;
