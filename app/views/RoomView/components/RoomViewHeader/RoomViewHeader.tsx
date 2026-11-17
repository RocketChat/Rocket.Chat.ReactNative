import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { useIsPexipCallSplit } from '~/lib/services/videoConf/usePexipCallStore';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { type IRoomViewProps, type RoomStore } from '~/views/RoomView/definitions';
import { useJsRoomHeader } from '~/views/RoomView/hooks/useJsRoomHeader';
import { NativeAvatarItem, NativeBackButton, NativeRoomTitle } from './NativeHeaderItems';
import { RoomHeaderActions } from './RoomHeaderActions';

interface IRoomViewHeaderProps {
	rid?: string;
	tmid?: string;
	name?: string;
	roomStore: RoomStore;
}

const NativeRoomHeader = ({ rid, tmid, name, roomStore }: IRoomViewHeaderProps & { rid: string }) => {
	const showsAvatar = useMasterDetail() && !tmid;

	return (
		<>
			<NativeRoomTitle tmid={tmid} threadName={name} roomStore={roomStore} />
			{showsAvatar ? <NativeAvatarItem rid={rid} roomStore={roomStore} /> : <NativeBackButton rid={rid} />}
			<RoomHeaderActions rid={rid} tmid={tmid} roomStore={roomStore} />
		</>
	);
};

const JsRoomHeader = ({ rid, tmid, name, roomStore }: IRoomViewHeaderProps) => {
	useJsRoomHeader({ rid, tmid, name, roomStore });
	return rid ? <RoomHeaderActions rid={rid} tmid={tmid} roomStore={roomStore} /> : null;
};

const useHideHeaderInPexipSplit = (rid?: string) => {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const isPexipSplit = useIsPexipCallSplit(rid);

	useLayoutEffect(() => {
		if (!rid) {
			return;
		}
		navigation.setOptions({ headerShown: !isPexipSplit });
	}, [navigation, rid, isPexipSplit]);
};

export const RoomViewHeader = ({ rid, tmid, name, roomStore }: IRoomViewHeaderProps) => {
	useHideHeaderInPexipSplit(rid);

	if (!hasNativeHeaderBar) {
		return <JsRoomHeader rid={rid} tmid={tmid} name={name} roomStore={roomStore} />;
	}
	if (!rid) {
		return null;
	}
	return <NativeRoomHeader rid={rid} tmid={tmid} name={name} roomStore={roomStore} />;
};
