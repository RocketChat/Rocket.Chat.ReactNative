import { View } from 'react-native';
import { PlainText } from 'react-native-plain-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '~/theme';
import { type IFooterPreviewProps } from '~/views/RoomView/definitions';
import styles from './styles';

export const Preview = ({ message }: IFooterPreviewProps) => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<View style={[styles.readOnly, { paddingBottom: bottom }]}>
			<PlainText style={[styles.previewMode, { color: colors.fontTitlesLabels }]}>{message}</PlainText>
		</View>
	);
};
