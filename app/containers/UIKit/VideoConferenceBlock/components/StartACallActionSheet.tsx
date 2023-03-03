import { Camera, CameraType } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../../i18n';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../../lib/hooks';
import { getRoomAvatar, getUidDirectMessage } from '../../../../lib/methods/helpers';
import { useTheme } from '../../../../theme';
import AvatarContainer from '../../../Avatar';
import Button from '../../../Button';
import { CustomIcon } from '../../../CustomIcon';
import { BUTTON_HIT_SLOP } from '../../../message/utils';
import StatusContainer from '../../../Status';
import useStyle from './styles';

const CAM_SIZE = { height: 220, width: 148 };
// fixed colors, do not change with theme change.
const gray300 = '#5f656e';
const gray100 = '#CBCED1';

export default function StartACallActionSheet({ rid, initCall }: { rid: string; initCall: Function }): React.ReactElement {
	const style = useStyle();
	const { colors } = useTheme();
	const [user, setUser] = useState({ username: '', avatar: '', uid: '' });
	const [mic, setMic] = useState(true);
	const [cam, setCam] = useState(false);
	const [calling, setCalling] = useState(true);
	const username = useAppSelector(state => state.login.user.username);

	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			const uid = (await getUidDirectMessage(room)) as string;
			const avt = getRoomAvatar(room);
			setUser({ uid, username: room?.name || '', avatar: avt });
		})();
	}, [rid]);

	const handleColors = (enabled: boolean) => {
		if (calling) {
			if (enabled) {
				return { button: colors.conferenceCallCallBackButton, icon: gray300 };
			}
			return { button: 'transparent', icon: gray100 };
		}
		if (enabled) {
			return { button: colors.conferenceCallEnabledIconBackground, icon: colors.conferenceCallEnabledIcon };
		}
		return { button: 'transparent', icon: colors.conferenceCallDisabledIcon };
	};

	return (
		<View style={style.actionSheetContainer}>
			<View style={style.actionSheetHeader}>
				<Text style={style.actionSheetHeaderTitle}>{calling ? i18n.t('Calling') : i18n.t('Start_a_call')}</Text>
				<View style={style.actionSheetHeaderButtons}>
					<Touchable
						onPress={() => setCam(!cam)}
						style={[style.iconCallContainer, { backgroundColor: handleColors(cam).button }, { marginRight: 6 }]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<CustomIcon name={cam ? 'camera' : 'camera-disabled'} size={20} color={handleColors(cam).icon} />
					</Touchable>
					<Touchable
						onPress={() => setMic(!mic)}
						style={[style.iconCallContainer, { backgroundColor: handleColors(mic).button }]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<CustomIcon name={mic ? 'microphone' : 'microphone-disabled'} size={20} color={handleColors(mic).icon} />
					</Touchable>
				</View>
			</View>
			<View style={style.actionSheetUsernameContainer}>
				<AvatarContainer text={user.avatar} size={36} />
				<StatusContainer size={16} id={user.uid} style={{ marginLeft: 8, marginRight: 6 }} />
				<Text style={style.actionSheetUsername} numberOfLines={1}>
					{user.username}
				</Text>
			</View>
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
					if (!calling) {
						setCalling(true);
						initCall({ cam, mic });
					} else {
						setCalling(false);
					}
				}}
				title={calling ? i18n.t('Cancel') : i18n.t('Call')}
			/>
		</View>
	);
}
