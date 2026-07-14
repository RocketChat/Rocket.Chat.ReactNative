import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../../theme';
import { type IFooterPreviewProps } from '../../definitions';
import styles from './styles';

export const Preview = ({ message }: IFooterPreviewProps) => {
	'use memo';

	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<View style={[styles.readOnly, { paddingBottom: bottom }]}>
			<Text style={[styles.previewMode, { color: colors.fontTitlesLabels }]}>{message}</Text>
		</View>
	);
};
