import React, { useEffect, useState } from 'react';
import { Camera, CameraType } from 'expo-camera';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';

import { cancelCall, initVideoCall } from '../../../../actions/videoConf';
import i18n from '../../../../i18n';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../../lib/hooks';
import { getRoomAvatar, getUidDirectMessage } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import AvatarContainer from '../../../Avatar';
import Button from '../../../Button';
import { CallHeader } from '../../../VideoConf/CallHeader';
import useStyle from './styles';
import { ESounds, useVideoConfRinger } from '../../../../lib/hooks/useVideoConf';

const CAM_SIZE = { height: 220, width: 148 };
// fixed colors, do not change with theme change.
export const gray300 = '#5f656e';
export const gray100 = '#CBCED1';

export default function StartACallActionSheet({ rid }: { rid: string }): React.ReactElement {
	const style = useStyle();
	const { playSound, stopSound } = useVideoConfRinger(ESounds.DIALTONE);

	const { colors } = useTheme();
	const [room, setRoom] = useState({ roomName: '', avatar: '', uid: '', direct: false });
	const [mic, setMic] = useState(true);
	const [cam, setCam] = useState(false);

	const username = useAppSelector(state => state.login.user.username);
	const calling = useAppSelector(state => state.videoConf.calling);
	const dispatch = useDispatch();

	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			const uid = (await getUidDirectMessage(room)) as string;
			const avt = getRoomAvatar(room);
			setRoom({ uid, roomName: room?.name || '', avatar: avt, direct: room?.t === 'd' });
		})();
	}, [rid]);

	return (
		<View style={style.actionSheetContainer}>
			<CallHeader
				title={calling ? i18n.t('Calling') : i18n.t('Start_a_call')}
				cam={cam}
				setCam={setCam}
				mic={mic}
				setMic={setMic}
				avatar={room.avatar}
				roomName={room.roomName}
				uid={room.uid}
				direct={room.direct}
			/>
			<View
				style={[
					style.actionSheetPhotoContainer,
					CAM_SIZE,
					{ backgroundColor: cam ? undefined : colors.conferenceCallPhotoBackground }
				]}
			>
				{cam ? <Camera style={CAM_SIZE} type={CameraType.front} /> : <AvatarContainer size={62} text={username} />}
			</View>
			<Button
				backgroundColor={calling ? colors.conferenceCallCallBackButton : colors.actionTintColor}
				color={calling ? gray300 : colors.conferenceCallEnabledIcon}
				onPress={() => {
					if (calling) {
						stopSound();
						dispatch(cancelCall({}));
					} else {
						playSound();
						dispatch(initVideoCall({ cam, mic, direct: room.direct, rid, uid: room.uid }));
					}
				}}
				title={calling ? i18n.t('Cancel') : i18n.t('Call')}
			/>
		</View>
	);
}
