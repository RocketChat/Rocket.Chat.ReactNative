import { hasNativeHeaderBar } from '~/lib/methods/helpers';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { type RoomStore } from '~/views/RoomView/definitions';
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

export const RoomViewHeader = ({ rid, tmid, name, roomStore }: IRoomViewHeaderProps) => {
	if (!hasNativeHeaderBar) {
		return <JsRoomHeader rid={rid} tmid={tmid} name={name} roomStore={roomStore} />;
	}
	if (!rid) {
		return null;
	}
	return <NativeRoomHeader rid={rid} tmid={tmid} name={name} roomStore={roomStore} />;
};
