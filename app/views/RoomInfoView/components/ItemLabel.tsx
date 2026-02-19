import { Text } from 'react-native';

import { useTheme } from '../../../theme';
import styles from '../styles';
import { useResponsiveLayout } from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface IItemLabel {
	label: string;
	testID?: string;
}

export const ItemLabel = ({ label, testID }: IItemLabel) => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	return (
		<Text accessibilityLabel={label} style={[styles.itemLabel, { color: colors.fontTitlesLabels, fontSize: scaleFontSize(14) }]} testID={testID}>
			{label}
		</Text>
	);
};
