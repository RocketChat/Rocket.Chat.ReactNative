import { StyleSheet, Switch, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import { textParser } from './utils';
import { type IChoice, type Option } from './interfaces';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8
	},
	label: {
		flex: 1,
		marginRight: 8
	},
	option: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	description: {
		fontSize: 14,
		marginTop: 2,
		...sharedStyles.textRegular
	}
});

const toSelectedValues = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export const ToggleSwitch = ({ element, value, action, loading }: IChoice) => {
	const { colors } = useTheme();
	const [selectedValues, select] = useState<string[]>(() => toSelectedValues(value));
	const options: Option[] = element?.options || [];

	useEffect(() => {
		select(toSelectedValues(value));
	}, [value]);

	const onToggle = (optionValue: string, toggled: boolean) => {
		if (loading) {
			return;
		}
		const next = toggled ? [...selectedValues, optionValue] : selectedValues.filter(item => item !== optionValue);
		select(next);
		action({ value: next });
	};

	return (
		<View>
			{options.map(option => {
				const checked = selectedValues.includes(option.value);
				return (
					<View key={option.value} style={styles.row}>
						<View style={styles.label}>
							<Text style={[styles.option, { color: colors.fontTitlesLabels }]}>{textParser([option.text])}</Text>
							{option.description ? (
								<Text style={[styles.description, { color: colors.fontSecondaryInfo }]}>{textParser([option.description])}</Text>
							) : null}
						</View>
						<Switch
							value={checked}
							disabled={loading}
							accessibilityLabel={textParser([option.text])}
							accessibilityRole='switch'
							testID={`toggle-${option.value}`}
							trackColor={{ false: colors.strokeMedium, true: colors.buttonBackgroundPrimaryDefault }}
							thumbColor={colors.surfaceLight}
							onValueChange={toggled => onToggle(option.value, toggled)}
						/>
					</View>
				);
			})}
		</View>
	);
};
