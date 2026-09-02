import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touch from '../../../../containers/Touch';
import { useTheme } from '../../../../theme';
import { useRoomScreen } from '../../stores/RoomScreenContext';
import styles from './styles';

export const FooterAction = ({
	testID,
	title,
	buttonTestID,
	buttonLabel,
	onPress
}: {
	testID: string;
	title: string;
	buttonTestID: string;
	buttonLabel: string;
	onPress: () => void;
}) => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();
	const { loading } = useRoomScreen();

	return (
		<View style={[styles.joinRoomContainer, { paddingBottom: bottom }]} testID={testID}>
			<Text style={[styles.previewMode, { color: colors.fontTitlesLabels }]}>{title}</Text>
			<Touch onPress={onPress} style={[styles.joinRoomButton, { backgroundColor: colors.fontHint }]} disabled={loading}>
				<Text style={[styles.joinRoomText, { color: colors.fontWhite }]} testID={buttonTestID}>
					{buttonLabel}
				</Text>
			</Touch>
		</View>
	);
};
