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

export const RadioButton = ({ element, value, action, loading }: IChoice) => {
	const { colors } = useTheme();
	const [selectedValue, setSelectedValue] = useState<string | undefined>(() => (typeof value === 'string' ? value : undefined));
	const options: Option[] = element?.options || [];

	useEffect(() => {
		setSelectedValue(typeof value === 'string' ? value : undefined);
	}, [value]);

	const onSelect = (optionValue: string) => {
		if (!loading && selectedValue !== optionValue) {
			setSelectedValue(optionValue);
			action({ value: optionValue });
		}
	};

	return (
		<View>
			{options.map(option => {
				const checked = selectedValue === option.value;
				return (
					<Touch
						key={option.value}
						accessible
						accessibilityLabel={`${textParser([option.text])}. ${checked ? 'checked' : 'unchecked'}`}
						accessibilityRole='radio'
						testID={`radio-${option.value}`}
						onPress={() => onSelect(option.value)}>
						<View style={styles.row}>
							<CustomIcon
								name={checked ? 'radio-checked' : 'radio-unchecked'}
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
