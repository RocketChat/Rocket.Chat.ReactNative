import React from 'react';
import { StyleSheet, Text } from 'react-native';

import * as List from '../../../containers/List';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});

const ListPercentage = ({
	value = 0,
	title,
	testID,
	onPress
}: {
	title: string;
	testID: string;
	value: number;
	onPress: () => void;
}) => {
	const { colors } = useTheme();

	const percentage = `${Math.floor(value)}%`;
	let percentageTextColor = colors.statusFontOnSuccess;
	if (value > 70 && value < 90) {
		percentageTextColor = colors.statusFontOnWarning;
	}
	if (value >= 90) {
		percentageTextColor = colors.statusFontOnDanger;
	}

	return (
		<List.Item
			title={title}
			testID={testID}
			onPress={onPress}
			right={() => <Text style={[styles.pickerText, { color: percentageTextColor }]}>{percentage}</Text>}
		/>
	);
};

export default ListPercentage;
