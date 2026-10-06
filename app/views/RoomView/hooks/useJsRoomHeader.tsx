import { useLayoutEffect } from 'react';
import { PixelRatio, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from 'zustand';

import RoomHeader from '~/containers/RoomHeader';
import { HeaderActions } from '~/lib/methods/helpers/navigation/headerActions';
import LeftButtons from '../components/LeftButtons';
import { RoomHeaderActions } from '../components/RoomViewHeader/RoomHeaderActions';
import { type IRoomViewProps, type RoomStore } from '../definitions';
import { useGoRoomActionsView } from './useGoRoomActionsView';
import { useHeaderFields } from './useHeaderFields';

interface IUseJsRoomHeaderParams {
	rid?: string;
	tmid?: string;
	name?: string;
	roomStore: RoomStore;
}

export const useJsRoomHeader = ({ rid, tmid, name: threadName, roomStore }: IUseJsRoomHeaderParams): void => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const headerFields = useHeaderFields(roomStore, tmid, threadName);
	const roomUserId = useStore(roomStore, s => s.roomUserId);
	const goRoomActionsView = useGoRoomActionsView(roomStore);

	useLayoutEffect(() => {
		if (!rid) {
			const height = 37 * PixelRatio.getFontScale();
			navigation.setOptions({ headerLeft: () => <View style={{ height }} /> });
			return;
		}

		navigation.setOptions({
			headerLeft: () => <LeftButtons rid={rid} tmid={tmid} roomStore={roomStore} />,
			headerRight: () => <RoomHeaderActions rid={rid} tmid={tmid} roomStore={roomStore} ActionsRenderer={HeaderActions} />
		});
	}, [rid, tmid, navigation, roomStore]);

	useLayoutEffect(() => {
		if (!rid) {
			return;
		}

		navigation.setOptions({
			headerTitle: () => (
				<RoomHeader
					prid={headerFields.prid}
					tmid={tmid}
					title={headerFields.title}
					teamMain={headerFields.teamMain}
					parentTitle={headerFields.parentTitle}
					subtitle={headerFields.subtitle}
					type={headerFields.type}
					roomUserId={roomUserId}
					visitor={headerFields.visitor}
					isGroupChat={headerFields.isGroupChat}
					onPress={goRoomActionsView}
					testID={`room-view-title-${headerFields.title}`}
					sourceType={headerFields.sourceType}
					abacAttributes={headerFields.abacAttributes}
					disabled={headerFields.disabled}
				/>
			)
		});
	}, [rid, tmid, headerFields, roomUserId, navigation, goRoomActionsView]);
};
