import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { acceptCall, cancelCall } from '../../../actions/videoConf';
import { ISubscription, SubscriptionType } from '../../../definitions';
import i18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks';
import { useEndpointData } from '../../../lib/hooks/useEndpointData';
import { hideNotification } from '../../../lib/methods/helpers/notifications';
import { CustomIcon } from '../../CustomIcon';
import { CallHeader } from '../../CallHeader';
import { useStyle } from './style';
import useUserData from '../../../lib/hooks/useUserData';
import Ringer, { ERingerSounds } from '../../Ringer';

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

const BUTTON_HIT_SLOP = { top: 12, right: 12, bottom: 12, left: 12 };

const IncomingCallHeader = React.memo(
	({ uid, callId, avatar, roomName }: { callId: string; avatar: string; uid: string; roomName: string }) => {
		const [mic, setMic] = useState(true);
		const [cam, setCam] = useState(false);
		const [audio, setAudio] = useState(true);
		const dispatch = useDispatch();
		const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
		const styles = useStyle();
		const insets = useSafeAreaInsets();

		return (
			<View
				style={[
					styles.container,
					isMasterDetail && styles.small,
					{
						marginTop: insets.top
					}
				]}
			>
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
				<View style={styles.row}>
					<Touchable
						hitSlop={BUTTON_HIT_SLOP}
						onPress={() => {
							setAudio(!audio);
							hideNotification();
						}}
						style={styles.closeButton}
					>
						<CustomIcon name='close' size={20} />
					</Touchable>
					<Touchable
						hitSlop={BUTTON_HIT_SLOP}
						onPress={() => {
							setAudio(!audio);
							hideNotification();
							dispatch(cancelCall({ callId }));
						}}
						style={styles.cancelButton}
					>
						<Text style={styles.buttonText}>{i18n.t('decline')}</Text>
					</Touchable>
					<Touchable
						hitSlop={BUTTON_HIT_SLOP}
						onPress={() => {
							setAudio(!audio);
							hideNotification();
							dispatch(acceptCall({ callId }));
						}}
						style={styles.acceptButton}
					>
						<Text style={styles.buttonText}>{i18n.t('accept')}</Text>
					</Touchable>
				</View>
				{audio ? <Ringer ringer={ERingerSounds.RINGTONE} /> : null}
			</View>
		);
	}
);

const IncomingCallNotification = ({
	notification: { rid, callId }
}: {
	notification: { rid: string; callId: string };
}): React.ReactElement | null => {
	const { result } = useEndpointData('video-conference.info', { callId });

	const user = useUserData(rid);

	if (result?.success && user.username) {
		return <IncomingCallHeader callId={callId} avatar={user.avatar} roomName={user.username} uid={user.uid} />;
	}
	return null;
};

export default IncomingCallNotification;
