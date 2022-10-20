import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import i18n from '../../../../i18n';
import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { useAppSelector } from '../../../../lib/hooks';
import { getRoomAvatar, getUidDirectMessage } from '../../../../lib/methods/helpers';
import { videoConfStartAndJoin } from '../../../../lib/methods/videoConf';
import { useTheme } from '../../../../theme';
import { useActionSheet } from '../../../ActionSheet';
import AvatarContainer from '../../../Avatar';
import Button from '../../../Button';
import { CustomIcon } from '../../../CustomIcon';
import { BUTTON_HIT_SLOP } from '../../../message/utils';
import StatusContainer from '../../../Status';
import useStyle from './styles';

export default function CallAgainActionSheet({ rid }: { rid: string }): React.ReactElement {
	const style = useStyle();
	const { colors } = useTheme();
	const [user, setUser] = useState({ username: '', avatar: '', uid: '', rid: '' });
	const [phone, setPhone] = useState(true);
	const [camera, setCamera] = useState(false);
	const username = useAppSelector(state => state.login.user.username);

	const { hideActionSheet } = useActionSheet();

	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			const uid = (await getUidDirectMessage(room)) as string;
			const avt = getRoomAvatar(room);
			setUser({ uid, username: room?.name || '', avatar: avt, rid: room?.id || '' });
		})();
	}, [rid]);

	const handleColor = (enabled: boolean) => (enabled ? colors.conferenceCallEnabledIcon : colors.conferenceCallDisabledIcon);

	return (
		<View style={style.actionSheetContainer}>
			<View style={style.actionSheetHeader}>
				<Text style={style.actionSheetHeaderTitle}>{i18n.t('Start_a_call')}</Text>
				<View style={style.actionSheetHeaderButtons}>
					<Touchable
						onPress={() => setCamera(!camera)}
						style={[style.iconCallContainer, camera && style.enabledBackground, { marginRight: 6 }]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<CustomIcon name={camera ? 'camera' : 'camera-disabled'} size={16} color={handleColor(camera)} />
					</Touchable>
					<Touchable
						onPress={() => setPhone(!phone)}
						style={[style.iconCallContainer, phone && style.enabledBackground]}
						hitSlop={BUTTON_HIT_SLOP}
					>
						<CustomIcon name={phone ? 'microphone' : 'microphone-disabled'} size={16} color={handleColor(phone)} />
					</Touchable>
				</View>
			</View>
			<View style={style.actionSheetUsernameContainer}>
				<AvatarContainer text={user.avatar} size={36} />
				<StatusContainer size={16} id={user.uid} style={{ marginLeft: 8, marginRight: 6 }} />
				<Text style={style.actionSheetUsername}>{user.username}</Text>
			</View>
			<View style={style.actionSheetPhotoContainer}>
				<AvatarContainer size={62} text={username} />
			</View>
			<Button
				onPress={() => {
					hideActionSheet();
					setTimeout(() => {
						videoConfStartAndJoin(user.rid, camera);
					}, 100);
				}}
				title={i18n.t('Call')}
			/>
		</View>
	);
}
