import { useState, memo, type ReactElement } from 'react';
import { useDispatch } from 'react-redux';

import { acceptCall, cancelCall } from '~/actions/videoConf';
import { type ISubscription, type SubscriptionType } from '~/definitions';
import i18n from '~/i18n';
import { useEndpointData } from '~/lib/hooks/useEndpointData';
import { CallHeader } from '~/containers/CallHeader';
import useUserData from '~/lib/hooks/useUserData';
import IncomingCallShell from './IncomingCallShell';

export interface INotifierComponent {
	notification: {
		text: string;
		payload: {
			sender: { username: string };
			type: SubscriptionType;
		} & Pick<ISubscription, '_id' | 'name' | 'rid' | 'prid'>;
		title: string;
		avatar: string;
	};
	isMasterDetail: boolean;
}

const IncomingCallHeader = memo(
	({ uid, callId, avatar, roomName }: { callId: string; avatar: string; uid: string; roomName: string }) => {
		const [mic, setMic] = useState(true);
		const [cam, setCam] = useState(false);
		const dispatch = useDispatch();

		return (
			<IncomingCallShell
				accessibilityLabel={`${i18n.t('Incoming_call_from')} ${roomName}`}
				header={
					<CallHeader
						title={i18n.t('Incoming_call_from')}
						cam={cam}
						setCam={setCam}
						mic={mic}
						setMic={setMic}
						avatar={avatar}
						name={roomName}
						uid={uid}
						direct={true}
					/>
				}
				onDecline={() => dispatch(cancelCall({ callId }))}
				onAccept={() => dispatch(acceptCall({ callId }))}
			/>
		);
	}
);

const IncomingCallNotification = ({
	notification: { rid, callId }
}: {
	notification: { rid: string; callId: string };
}): ReactElement | null => {
	const { result } = useEndpointData('video-conference.info', { callId });

	const user = useUserData(rid);

	if (result?.success && user.username) {
		return <IncomingCallHeader callId={callId} avatar={user.avatar} roomName={user.username} uid={user.uid} />;
	}
	return null;
};

export default IncomingCallNotification;
