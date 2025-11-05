import { Text } from 'react-native';

import { useTheme } from '../../../theme';
import styles from '../styles';

interface IItemLabel {
	label: string;
	testID?: string;
}

export const ItemLabel = ({ label, testID }: IItemLabel) => {
	const { colors } = useTheme();
	return (
		<Text accessibilityLabel={label} style={[styles.itemLabel, { color: colors.fontTitlesLabels }]} testID={testID}>
			{label}
		</Text>
	);
};
