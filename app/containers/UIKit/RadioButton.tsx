import { StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import Radio from '../Radio';
import Touch from '../Touch';
import sharedStyles from '~/views/Styles';
import { useTheme } from '~/theme';
import { textParser } from './utils';
import { type IRadioButton } from './interfaces';

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
	const options = element.options || [];

	return (
		<View accessibilityRole='radiogroup'>
			{options.map(option => {
				const checked = value === option.value;
				const label = textParser([option.text]);
				return (
					<Touch
						key={option.value}
						testID={`uikit-radio-${element.actionId}-${option.value}`}
						onPress={() => onChange({ value: option.value })}
						disabled={loading}
						style={styles.option}
						accessible
						accessibilityRole='radio'
						accessibilityLabel={`${label}, ${checked ? I18n.t('Selected') : I18n.t('Unselected')}`}>
						<Radio check={checked} />
						<Text style={[styles.label, { color: colors.fontDefault }]}>{label}</Text>
					</Touch>
				);
			})}
		</View>
	);
};
