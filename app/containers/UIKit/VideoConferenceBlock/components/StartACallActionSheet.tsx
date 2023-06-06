import { Camera, CameraType } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';

import { cancelCall, initVideoCall } from '../../../../actions/videoConf';
import { SubscriptionType } from '../../../../definitions';
import i18n from '../../../../i18n';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../../lib/hooks';
import { ESounds, useVideoConfRinger } from '../../../../lib/hooks/useVideoConf';
import { getRoomAvatar, getUidDirectMessage } from '../../../../lib/methods/helpers';
import { Services } from '../../../../lib/services';
import { getUserSelector } from '../../../../selectors/login';
import { useTheme } from '../../../../theme';
import AvatarContainer from '../../../Avatar';
import Button from '../../../Button';
import { CallHeader } from '../../../VideoConf/CallHeader';
import useStyle from './styles';

const CAM_SIZE = { height: 220, width: 148 };

export const useUserData = (rid: string) => {
	const [user, setUser] = useState({ username: '', avatar: '', uid: '', type: '', direct: false });
	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			if (room) {
				const uid = (await getUidDirectMessage(room)) as string;
				const avt = getRoomAvatar(room);
				setUser({
					uid,
					username: room?.name || '',
					avatar: avt,
					type: room?.t || '',
					direct: room?.t === SubscriptionType.DIRECT
				});
			} else {
				try {
					const result = await Services.getUserInfo(rid);
					if (result.success) {
						setUser({
							username: result.user.name || result.user.username,
							avatar: result.user.username,
							uid: result.user._id,
							type: SubscriptionType.DIRECT,
							direct: true
						});
					}
				} catch (error) {
					//
				}
			}
		})();
	}, []);

	return user;
};

export default function StartACallActionSheet({ rid }: { rid: string }): React.ReactElement {
	const style = useStyle();
	const { playSound, stopSound } = useVideoConfRinger(ESounds.DIALTONE, false);

	const { colors } = useTheme();
	const [mic, setMic] = useState(true);
	const [cam, setCam] = useState(false);

	const username = useAppSelector(state => getUserSelector(state).username);
	const calling = useAppSelector(state => state.videoConf.calling);
	const dispatch = useDispatch();

	const user = useUserData(rid);

	return (
		<View style={style.actionSheetContainer}>
			<CallHeader
				title={calling ? i18n.t('Calling') : i18n.t('Start_a_call')}
				cam={cam}
				mic={mic}
				setCam={setCam}
				setMic={setMic}
				avatar={user.avatar}
				name={user.username}
				uid={user.uid}
				direct={user.direct}
			/>
			<View
				style={[
					style.actionSheetPhotoContainer,
					CAM_SIZE,
					{ backgroundColor: cam ? undefined : colors.conferenceCallPhotoBackground }
				]}
			>
				{cam ? (
					<Camera style={CAM_SIZE} type={CameraType.front} />
				) : (
					<AvatarContainer size={62} text={username} rid={rid} type={user.type} />
				)}
			</View>
			<Button
				backgroundColor={calling ? colors.conferenceCallCallBackButton : colors.actionTintColor}
				color={calling ? colors.gray300 : colors.conferenceCallEnabledIcon}
				onPress={() => {
					if (calling) {
						stopSound();
						dispatch(cancelCall({}));
					} else {
						playSound();
						dispatch(initVideoCall({ cam, mic, direct: user.direct, rid, uid: user.uid }));
					}
				}}
				title={calling ? i18n.t('Cancel') : i18n.t('Call')}
			/>
		</View>
	);
}
