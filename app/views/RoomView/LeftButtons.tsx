import { StyleSheet, useWindowDimensions } from 'react-native';
import { type ReactElement } from 'react';

import Avatar from '../../containers/Avatar';
import { useAppNavigation } from '../../lib/hooks/navigation';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import { getUserSelector } from '../../selectors/login';
import { HeaderBackButton } from '../../containers/Header/components/HeaderBackButton';
import { useUnreadsCount } from './hooks/useUnreadsCount';
import { useGoRoomActionsView } from './hooks/useGoRoomActionsView';
import { useRoomStoreByRid } from './stores/RoomStore';

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 10
	}
});

interface ILeftButtonsProps {
	rid?: string;
	tmid?: string;
}

const LeftButtons = ({ rid, tmid }: ILeftButtonsProps): ReactElement | null => {
	'use memo';

	const { goBack } = useAppNavigation();
	const goRoomActionsView = useGoRoomActionsView(rid);
	const isMasterDetail = useMasterDetail();
	const baseUrl = useAppSelector(state => state.server.server);
	const { id: userId, token } = useAppSelector(getUserSelector);
	const room = useRoomStoreByRid(rid, s => s.room);
	const t = room.t;
	const title = 'id' in room ? room.name : undefined;

	const onPress = () => goRoomActionsView();
	const { fontScale } = useWindowDimensions();
	const unreadsCount = useUnreadsCount(rid);

	if (!isMasterDetail || tmid) {
		let label = ' ';
		let labelLength = 1;
		let marginLeft = 0;
		let fontSize = 0;
		if (unreadsCount) {
			label = unreadsCount > 99 ? '+99' : unreadsCount.toString() || ' ';
			labelLength = label.length ? label.length : 1;
			marginLeft = -4 * labelLength;
			fontSize = labelLength > 1 ? 14 : 17;
		}
		return <HeaderBackButton label={label} onPress={goBack} labelStyle={{ fontSize: fontSize * fontScale, marginLeft }} />;
	}

	if (baseUrl && userId && token) {
		return <Avatar rid={rid} text={title} size={30} type={t} style={styles.avatar} onPress={onPress} />;
	}
	return null;
};

export default LeftButtons;
