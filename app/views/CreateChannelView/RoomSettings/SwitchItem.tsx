import React from 'react';
import { StyleSheet, Switch, Text, View, SwitchProps } from 'react-native';

import I18n from '../../../i18n';
import { SWITCH_TRACK_COLOR } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';

const styles = StyleSheet.create({
	switchContainer: {
		minHeight: 54,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		maxHeight: 80,
		marginBottom: 12
	},
	switchTextContainer: {
		flex: 1,
		marginRight: 8
	},
	label: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	hint: {
		fontSize: 14,
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
		<View style={[styles.switchContainer, { backgroundColor: colors.backgroundColor }]}>
			<View style={styles.switchTextContainer}>
				<Text style={[styles.label, { color: colors.titleText }]}>{I18n.t(label)}</Text>
				<Text testID={`create-channel-${id}-hint`} style={[styles.hint, { color: colors.auxiliaryText }]}>
					{I18n.t(hint)}
				</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				testID={`create-channel-${id}`}
				trackColor={SWITCH_TRACK_COLOR}
				disabled={disabled}
			/>
		</View>
	);
};
