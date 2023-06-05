import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../../i18n';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../../lib/hooks';
import { getRoomAvatar, getUidDirectMessage } from '../../../../lib/methods/helpers';
import { Services } from '../../../../lib/services';
import { useTheme } from '../../../../theme';
import { useActionSheet } from '../../../ActionSheet';
import AvatarContainer from '../../../Avatar';
import Button from '../../../Button';
import { CustomIcon } from '../../../CustomIcon';
import StatusContainer from '../../../Status';
import { BUTTON_HIT_SLOP } from '../../../message/utils';
import useStyle from './styles';

const useUserData = (rid: string) => {
	const [user, setUser] = useState({ username: '', avatar: '', uid: '', type: '' });
	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			if (room) {
				const uid = (await getUidDirectMessage(room)) as string;
				const avt = getRoomAvatar(room);
				setUser({ uid, username: room?.name || '', avatar: avt, type: room?.t || '' });
			} else {
				try {
					const result = await Services.getUserInfo(rid);
					if (result.success) {
						setUser({
							username: result.user.name || result.user.username,
							avatar: result.user.username,
							uid: result.user._id,
							type: 'd'
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

export default function StartACallActionSheet({ rid, initCall }: { rid: string; initCall: Function }): React.ReactElement {
	const style = useStyle();
	const { colors } = useTheme();
	const [mic, setMic] = useState(true);
	const [cam, setCam] = useState(false);
	const username = useAppSelector(state => state.login.user.username);

	const { hideActionSheet } = useActionSheet();
	const user = useUserData(rid);

	const handleColor = (enabled: boolean) => (enabled ? colors.conferenceCallEnabledIcon : colors.conferenceCallDisabledIcon);

	return (
		<View style={style.actionSheetContainer}>
			<View style={style.actionSheetHeader}>
				<Text style={style.actionSheetHeaderTitle}>{i18n.t('Start_a_call')}</Text>
				<View style={style.actionSheetHeaderButtons}>
					<Touchable
						onPress={() => setCam(!cam)}
						style={[style.iconCallContainer, cam && style.enabledBackground, { marginRight: 6 }]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<CustomIcon name={cam ? 'camera' : 'camera-disabled'} size={20} color={handleColor(cam)} />
					</Touchable>
					<Touchable
						onPress={() => setMic(!mic)}
						style={[style.iconCallContainer, mic && style.enabledBackground]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<CustomIcon name={mic ? 'microphone' : 'microphone-disabled'} size={20} color={handleColor(mic)} />
					</Touchable>
				</View>
			</View>
			<View style={style.actionSheetUsernameContainer}>
				<AvatarContainer text={user.avatar} size={36} rid={rid} type={user.type} />
				<StatusContainer size={16} id={user.uid} style={{ marginLeft: 8, marginRight: 6 }} />
				<Text style={style.actionSheetUsername} numberOfLines={1}>
					{user.username}
				</Text>
			</View>
			<View style={style.actionSheetPhotoContainer}>
				<AvatarContainer size={62} text={username} />
			</View>
			<Button
				onPress={() => {
					hideActionSheet();
					setTimeout(() => {
						initCall({ cam, mic });
					}, 100);
				}}
				title={i18n.t('Call')}
			/>
		</View>
	);
}
