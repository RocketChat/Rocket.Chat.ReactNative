import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	indicator: {
		padding: 10
	}
});

const RCActivityIndicator = () => <ActivityIndicator style={styles.indicator} />;

export default RCActivityIndicator;
