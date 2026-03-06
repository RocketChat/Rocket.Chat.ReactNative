import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';

export const Container = ({ children }: { children: React.ReactElement[] | React.ReactElement }) => {
	const { colors } = useTheme();

	return <View style={[styles.container, { backgroundColor: colors.surfaceLight }]}>{children}</View>;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 16
	}
});
