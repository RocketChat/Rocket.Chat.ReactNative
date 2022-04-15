import React, { memo, useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import * as List from '../../../containers/List';
import styles from '../../../views/RoomsListView/styles';
import { SWITCH_TRACK_COLOR, themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import UnreadBadge from '../../../containers/UnreadBadge';
import RocketChat from '../../../lib/rocketchat';
import { changeLivechatStatus, isOmnichannelStatusAvailable } from '../lib';
import { IUser } from '../../../definitions/IUser';
import Touch from '../../../utils/touch';

interface IOmnichannelStatus {
	searching: boolean;
	goQueue: () => void;
	queueSize: number;
	inquiryEnabled: boolean;
	user: IUser;
}

const OmnichannelStatus = memo(({ searching, goQueue, queueSize, inquiryEnabled, user }: IOmnichannelStatus) => {
	const { theme } = useTheme();
	const [status, setStatus] = useState<boolean>(false);
	const canUseOmnichannel = RocketChat.isOmnichannelModuleAvailable() && user?.roles?.includes('livechat-agent');

	useEffect(() => {
		if (canUseOmnichannel) {
			setStatus(isOmnichannelStatusAvailable(user));
		}
	}, [user.statusLivechat]);

	if (searching || !canUseOmnichannel) {
		return null;
	}

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
						<Touch theme={theme} onPress={toggleLivechat}>
							<Switch value={status} trackColor={SWITCH_TRACK_COLOR} onValueChange={toggleLivechat} />
						</Touch>
					</View>
				)}
			/>
			<List.Separator />
		</>
	);
});

export default OmnichannelStatus;
