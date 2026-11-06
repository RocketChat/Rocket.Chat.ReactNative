import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { CustomIcon } from '../CustomIcon';
import Touch from '../Touch';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import { textParser } from './utils';
import { type IChoice, type Option } from './interfaces';

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingVertical: 8
	},
	label: {
		flex: 1,
		marginLeft: 8
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

export const Checkbox = ({ element, value, action, loading }: IChoice) => {
	const { colors } = useTheme();
	const [selectedValues, select] = useState<string[]>(() => toSelectedValues(value));
	const options: Option[] = element?.options || [];

	useEffect(() => {
		select(toSelectedValues(value));
	}, [value]);

	const onSelect = (optionValue: string) => {
		if (loading) {
			return;
		}
		const next = selectedValues.includes(optionValue)
			? selectedValues.filter(item => item !== optionValue)
			: [...selectedValues, optionValue];
		select(next);
		action({ value: next });
	};

	return (
		<View>
			{options.map(option => {
				const checked = selectedValues.includes(option.value);
				return (
					<Touch
						key={option.value}
						accessible
						accessibilityLabel={`${textParser([option.text])}. ${checked ? 'checked' : 'unchecked'}`}
						accessibilityRole='checkbox'
						testID={`checkbox-${option.value}`}
						onPress={() => onSelect(option.value)}>
						<View style={styles.row}>
							<CustomIcon
								name={checked ? 'checkbox-checked' : 'checkbox-unchecked'}
								size={22}
								color={checked ? colors.badgeBackgroundLevel2 : colors.strokeMedium}
							/>
							<View style={styles.label}>
								<Text style={[styles.option, { color: colors.fontTitlesLabels }]}>{textParser([option.text])}</Text>
								{option.description ? (
									<Text style={[styles.description, { color: colors.fontSecondaryInfo }]}>
										{textParser([option.description])}
									</Text>
								) : null}
							</View>
						</View>
					</Touch>
				);
			})}
		</View>
	);
};
