import React, { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { acceptCall, cancelCall } from '../../../actions/videoConf';
import { ISubscription, SubscriptionType } from '../../../definitions';
import i18n from '../../../i18n';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../lib/hooks';
import { useEndpointData } from '../../../lib/hooks/useEndpointData';
import { ESounds, useVideoConfRinger } from '../../../lib/hooks/useVideoConf';
import { getRoomAvatar } from '../../../lib/methods/helpers';
import { hideNotification } from '../../../lib/methods/helpers/notifications';
import { CustomIcon } from '../../CustomIcon';
import { CallHeader } from '../../VideoConf/CallHeader';
import { useStyle } from './style';
import { useTheme } from '../../../theme';

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
		const dispatch = useDispatch();
		const { playSound } = useVideoConfRinger(ESounds.DIALTONE);

		const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
		const styles = useStyle();

		const insets = useSafeAreaInsets();
		const { height, width } = useWindowDimensions();
		const isLandscape = width > height;

		useEffect(() => {
			(() => playSound())();
		}, []);

		const { colors } = useTheme();

		return (
			<View
				style={[
					styles.container,
					(isMasterDetail || isLandscape) && styles.small,
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
					roomName={roomName}
					uid={uid}
					direct={true}
				/>
				<View style={styles.row}>
					<Touchable hitSlop={BUTTON_HIT_SLOP} onPress={hideNotification} style={styles.closeButton}>
						<CustomIcon name='close' size={20} color={colors.gray300} />
					</Touchable>
					<Touchable
						hitSlop={BUTTON_HIT_SLOP}
						onPress={() => {
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
							hideNotification();
							dispatch(acceptCall({ callId }));
						}}
						style={styles.acceptButton}
					>
						<Text style={styles.buttonText}>{i18n.t('accept')}</Text>
					</Touchable>
				</View>
			</View>
		);
	}
);

const IncomingCallNotification = ({
	notification: { rid, uid, callId }
}: {
	notification: { rid: string; uid: string; callId: string };
}): React.ReactElement | null => {
	const [roomInfo, setRoomInfo] = useState({ roomName: '', avatar: '', uid: '', direct: false });
	const { result } = useEndpointData('video-conference.info', { callId });

	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			if (room?.rid) {
				const avt = getRoomAvatar(room);
				setRoomInfo({ uid, roomName: room?.name || '', avatar: avt, direct: room?.t === 'd' });
			}
		})();
	}, [result?.success, rid]);

	if (result?.success && roomInfo.roomName) {
		return <IncomingCallHeader callId={callId} avatar={roomInfo.avatar} roomName={roomInfo.roomName} uid={roomInfo.uid} />;
	}
	return null;
};

export default IncomingCallNotification;
