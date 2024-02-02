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

type TPercentageState = 'success' | 'warning' | 'danger';

const DANGER_VALUE = 90;
const WARNING_MINIMUM_VALUE = 70;
const WARNING_MAXIMUM_VALUE = 90;

const getPercentageState = (value: number): TPercentageState => {
	if (value > WARNING_MINIMUM_VALUE && value < WARNING_MAXIMUM_VALUE) {
		return 'warning';
	}
	if (value >= DANGER_VALUE) {
		return 'danger';
	}
	return 'success';
};

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
	const percentageState = getPercentageState(value);

	let percentageTextColor = colors.statusFontOnSuccess;
	if (percentageState === 'warning') {
		percentageTextColor = colors.statusFontOnWarning;
	}
	if (percentageState === 'danger') {
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
