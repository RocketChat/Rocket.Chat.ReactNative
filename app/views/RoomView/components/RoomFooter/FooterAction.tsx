import { type ReactElement } from 'react';
import { View } from 'react-native';
import { PlainText } from '~/containers/PlainText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touch from '~/containers/Touch';
import { useTheme } from '~/theme';
import { useRoomScreen } from '~/views/RoomView/stores/RoomScreenContext';
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
}): ReactElement => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();
	const { loading } = useRoomScreen();

	return (
		<View style={[styles.joinRoomContainer, { paddingBottom: bottom }]} testID={testID}>
			<PlainText style={[styles.previewMode, { color: colors.fontTitlesLabels }]}>{title}</PlainText>
			<Touch onPress={onPress} style={[styles.joinRoomButton, { backgroundColor: colors.fontHint }]} disabled={loading}>
				<PlainText style={[styles.joinRoomText, { color: colors.fontWhite }]} testID={buttonTestID}>
					{buttonLabel}
				</PlainText>
			</Touch>
		</View>
	);
};
