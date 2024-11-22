import React from 'react';
import { StyleSheet, Text, View, SwitchProps, Pressable } from 'react-native';

import I18n from '../../../i18n';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';
import Switch from '../../../containers/Switch';

const styles = StyleSheet.create({
	switchContainer: {
		minHeight: 54,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		maxHeight: 80
	},
	switchTextContainer: {
		flex: 1,
		marginRight: 8
	},
	label: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textMedium
	},
	hint: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular
	}
});

export interface ISwitch extends SwitchProps {
	id: string;
	label: string;
	hint: string;
	onValueChange: (value: boolean) => void;
}

export const SwitchItem = ({ id, value, label, hint, onValueChange, disabled = false }: ISwitch) => {
	const { colors } = useTheme();

	return (
		<Pressable
			disabled={disabled}
			onPress={() => onValueChange(!value)}
			accessible
			accessibilityLabel={`${I18n.t(label)}, ${I18n.t(hint)}`}>
			<View style={[styles.switchContainer, { backgroundColor: colors.surfaceRoom }]}>
				<View style={styles.switchTextContainer}>
					<Text style={[styles.label, { color: colors.fontTitlesLabels }]}>{I18n.t(label)}</Text>
					<Text testID={`create-channel-${id}-hint`} style={[styles.hint, { color: colors.fontSecondaryInfo }]}>
						{I18n.t(hint)}
					</Text>
				</View>
				<Switch value={value} onValueChange={onValueChange} testID={`create-channel-${id}`} disabled={disabled} />
			</View>
		</Pressable>
	);
};
