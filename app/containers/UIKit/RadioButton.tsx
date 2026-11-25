import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Radio from '../Radio';
import Touch from '../Touch';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import { textParser } from './utils';
import { type IRadioButton, type Option } from './interfaces';

const styles = StyleSheet.create({
	option: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 6,
		gap: 8
	},
	label: {
		flex: 1,
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textRegular
	}
});

export const RadioButton = ({ element, value, loading, onChange }: IRadioButton) => {
	const { colors } = useTheme();
	const [selected, setSelected] = useState(value);
	const [syncedValue, setSyncedValue] = useState(value);
	if (value !== syncedValue) {
		setSyncedValue(value);
		setSelected(value);
	}
	const options = element.options || [];

	const onPress = async (optionValue: Option['value']) => {
		const previous = selected;
		setSelected(optionValue);
		const succeeded = await onChange({ value: optionValue });
		if (!succeeded) {
			setSelected(current => (current === optionValue ? previous : current));
		}
	};

	return (
		<View accessibilityRole='radiogroup'>
			{options.map(option => {
				const checked = selected === option.value;
				return (
					<Touch
						key={option.value}
						testID={`uikit-radio-${element.actionId}-${option.value}`}
						onPress={() => onPress(option.value)}
						disabled={loading}
						style={styles.option}
						accessible
						accessibilityRole='radio'
						accessibilityState={{ checked, disabled: loading }}>
						<Radio check={checked} />
						<Text style={[styles.label, { color: colors.fontDefault }]}>{textParser([option.text])}</Text>
					</Touch>
				);
			})}
		</View>
	);
};
