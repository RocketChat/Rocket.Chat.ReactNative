import React, { memo, useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import * as List from '../../../../containers/List';
import styles from './styles';
import { themes } from '../../../../lib/constants';
import { useTheme } from '../../../../theme';
import RocketChat from '../../../../lib/rocketchat';
import { changeLivechatStatus, isOmnichannelStatusAvailable } from '../../lib';
import { IUser } from '../../../../definitions/IUser';
import { isIOS } from '../../../../utils/deviceInfo';
import OmnichannelQueue from './OmnichannelQueue';

interface IOmnichannelStatus {
	searching: boolean;
	goQueue: () => void;
	queueSize: number;
	inquiryEnabled: boolean;
	user: IUser;
}

const OmnichannelStatus = memo(({ searching, goQueue, queueSize, user }: IOmnichannelStatus) => {
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
				color={themes[theme].bodyText}
				onPress={toggleLivechat}
				right={() => (
					<View style={styles.omnichannelRightContainer}>
						<Switch
							value={status}
							trackColor={{ true: themes[theme].omnichannelTrueSwitch, false: themes[theme].omnichannelFalseSwitch }}
							thumbColor={!isIOS && (status ? themes[theme].omnichannelTrueSwitch : themes[theme].switchAndroidThumbFalse)}
							onValueChange={toggleLivechat}
						/>
					</View>
				)}
			/>
			<List.Separator />
			{status ? <OmnichannelQueue queueSize={queueSize} onPress={goQueue} /> : null}
		</>
	);
});

export default OmnichannelStatus;
