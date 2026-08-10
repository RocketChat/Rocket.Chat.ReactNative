import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touch from '../../../../containers/Touch';
import I18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import { type IOnHoldProps } from '../../definitions';
import { useRoomStore } from '../../stores/RoomStoreContext';
import styles from './styles';

export const OnHold = ({ loading }: IOnHoldProps) => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();
	const resumeRoom = useRoomStore(s => s.resumeRoom);

	return (
		<View style={[styles.joinRoomContainer, { paddingBottom: bottom }]} testID='room-view-chat-on-hold'>
			<Text style={[styles.previewMode, { color: colors.fontTitlesLabels }]}>{I18n.t('Chat_is_on_hold')}</Text>
			<Touch onPress={resumeRoom} style={[styles.joinRoomButton, { backgroundColor: colors.fontHint }]} disabled={loading}>
				<Text style={[styles.joinRoomText, { color: colors.fontWhite }]} testID='room-view-chat-on-hold-button'>
					{I18n.t('Resume')}
				</Text>
			</Touch>
		</View>
	);
};
