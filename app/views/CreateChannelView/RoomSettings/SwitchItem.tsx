import { Text, View, type SwitchProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import Switch from '../../../containers/Switch';

const styles = StyleSheet.create(theme => ({
	switchContainer: {
		minHeight: 54,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		backgroundColor: theme.colors.surfaceTint
	},
	switchTextContainer: {
		flex: 1,
		marginRight: 8
	},
	label: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textMedium,
		color: theme.colors.fontTitlesLabels
	},
	hint: {
		fontSize: 14,
		lineHeight: 20,
		...sharedStyles.textRegular,
		color: theme.colors.fontSecondaryInfo
	}
}));

export interface ISwitch extends SwitchProps {
	id: string;
	label: string;
	hint: string;
	onValueChange: (value: boolean) => void;
}

export const SwitchItem = ({ id, value, label, hint, onValueChange, disabled = false }: ISwitch) => (
	<View style={styles.switchContainer}>
		<View accessible accessibilityLabel={`${I18n.t(label)}, ${I18n.t(hint)}`} style={styles.switchTextContainer}>
			<Text style={styles.label}>{I18n.t(label)}</Text>
			<Text testID={`create-channel-${id}-hint`} style={styles.hint}>
				{I18n.t(hint)}
			</Text>
		</View>
		<Switch
			accessibilityRole='switch'
			accessible
			value={value}
			onValueChange={onValueChange}
			testID={`create-channel-${id}`}
			disabled={disabled}
		/>
	</View>
);
