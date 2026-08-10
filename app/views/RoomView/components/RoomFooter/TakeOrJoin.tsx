import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touch from '../../../../containers/Touch';
import I18n from '../../../../i18n';
import { useTheme } from '../../../../theme';
import { type ITakeOrJoinProps } from '../../definitions';
import { useRoomStore, useRoomWithUpdate } from '../../stores/RoomStoreContext';
import styles from './styles';

export const TakeOrJoin = ({ joinCodeRef }: ITakeOrJoinProps) => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();
	const room = useRoomWithUpdate();
	const loading = useRoomStore(s => s.loading);
	const joinRoom = useRoomStore(s => s.joinRoom);

	// The join-code modal lives on this screen, so the trigger is handed to joinRoom per call.
	const onPressJoin = () => joinRoom(() => joinCodeRef.current?.show());

	return (
		<View style={[styles.joinRoomContainer, { paddingBottom: bottom }]} testID='room-view-join'>
			<Text style={[styles.previewMode, { color: colors.fontTitlesLabels }]}>{I18n.t('You_are_in_preview_mode')}</Text>
			<Touch onPress={onPressJoin} style={[styles.joinRoomButton, { backgroundColor: colors.fontHint }]} disabled={loading}>
				<Text style={[styles.joinRoomText, { color: colors.fontWhite }]} testID='room-view-join-button'>
					{I18n.t(room.t === 'l' ? 'Take_it' : 'Join')}
				</Text>
			</Touch>
		</View>
	);
};
