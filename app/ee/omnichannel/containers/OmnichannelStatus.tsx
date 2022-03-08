import React, { memo, useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import * as List from '../../../containers/List';
import styles from '../../../views/RoomsListView/styles';
import { SWITCH_TRACK_COLOR, themes } from '../../../constants/colors';
import { useTheme } from '../../../theme';
import UnreadBadge from '../../../presentation/UnreadBadge';
import RocketChat from '../../../lib/rocketchat';
import { changeLivechatStatus, isOmnichannelStatusAvailable } from '../lib';
import { IUser } from '../../../definitions/IUser';

interface IOmnichannelStatus {
	searching: boolean;
	goQueue: () => void;
	queueSize: number;
	inquiryEnabled: boolean;
	user: IUser;
}

const OmnichannelStatus = memo(({ searching, goQueue, queueSize, inquiryEnabled, user }: IOmnichannelStatus) => {
	if (searching || !(RocketChat.isOmnichannelModuleAvailable() && user?.roles?.includes('livechat-agent'))) {
		return null;
	}
	const { theme } = useTheme();
	const [status, setStatus] = useState(isOmnichannelStatusAvailable(user));

	useEffect(() => {
		setStatus(isOmnichannelStatusAvailable(user));
	}, [user.statusLivechat]);

	const toggleLivechat = async () => {
		try {
			setStatus(v => !v);
			await changeLivechatStatus();
		} catch {
			setStatus(v => !v);
		}
	};

	return (
		<>
			<List.Item
				title='Omnichannel'
				left={() => <List.Icon name='omnichannel' />}
				color={themes[theme].auxiliaryText}
				onPress={goQueue}
				right={() => (
					<View style={styles.omnichannelRightContainer}>
						{inquiryEnabled ? <UnreadBadge style={styles.queueIcon} unread={queueSize} /> : null}
						<Switch value={status} trackColor={SWITCH_TRACK_COLOR} onValueChange={toggleLivechat} />
					</View>
				)}
			/>
			<List.Separator />
		</>
	);
});

export default OmnichannelStatus;
