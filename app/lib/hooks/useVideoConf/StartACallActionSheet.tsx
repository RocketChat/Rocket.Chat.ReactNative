import { Camera, CameraType } from 'expo-camera';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';

import { ESounds, useVideoConfRinger } from '.';
import { useAppSelector } from '..';
import { cancelCall, initVideoCall } from '../../../actions/videoConf';
import AvatarContainer from '../../../containers/Avatar';
import Button from '../../../containers/Button';
import useStyle from '../../../containers/UIKit/VideoConferenceBlock/components/styles';
import { CallHeader } from '../../../containers/VideoConf/CallHeader';
import i18n from '../../../i18n';
import { getUserSelector } from '../../../selectors/login';
import { useTheme } from '../../../theme';
import useUserData from '../useUserData';

const CAM_SIZE = { height: 220, width: 148 };

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
				{cam ? <Camera type={CameraType.front} /> : <AvatarContainer size={62} text={username} rid={rid} type={user.type} />}
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
