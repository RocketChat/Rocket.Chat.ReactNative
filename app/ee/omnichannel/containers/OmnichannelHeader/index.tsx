import React, { memo, useEffect, useState } from 'react';
import { View } from 'react-native';

import * as List from '../../../../containers/List';
import styles from './styles';
import { themes } from '../../../../lib/constants';
import { useTheme } from '../../../../theme';
import { IUser } from '../../../../definitions';
import { showConfirmationAlert } from '../../../../lib/methods/helpers/info';
import I18n from '../../../../i18n';
import { changeLivechatStatus, isOmnichannelStatusAvailable } from '../../lib';
import OmnichannelQueue from './OmnichannelQueue';
import { isOmnichannelModuleAvailable } from '../../../../lib/methods';
import Switch from '../../../../containers/Switch';

interface IOmnichannelStatus {
	searching: boolean;
	goQueue: () => void;
	queueSize: number;
	inquiryEnabled: boolean;
	user: IUser;
}

const OmnichannelStatus = memo(({ searching, goQueue, queueSize, user }: IOmnichannelStatus) => {
	const { theme } = useTheme();
	const [status, setStatus] = useState(isOmnichannelStatusAvailable(user));

	useEffect(() => {
		setStatus(isOmnichannelStatusAvailable(user));
	}, [user.statusLivechat]);

	if (searching || !(isOmnichannelModuleAvailable() && user?.roles?.includes('livechat-agent'))) {
		return null;
	}

	const toggleLivechat = async () => {
		// if not-available, prompt to change to available
		if (!isOmnichannelStatusAvailable(user)) {
			showConfirmationAlert({
				message: I18n.t('Omnichannel_enable_alert'),
				confirmationText: I18n.t('Yes'),
				onPress: async () => {
					try {
						await changeLivechatStatus();
					} catch {
						// Do nothing
					}
				}
			});
		} else {
			try {
				setStatus(v => !v);
				await changeLivechatStatus();
			} catch {
				setStatus(v => !v);
			}
		}
	};

	return (
		<>
			<List.Item
				title='Omnichannel'
				color={themes[theme].fontDefault}
				onPress={toggleLivechat}
				additionalAcessibilityLabel={status}
				right={() => (
					<View style={styles.omnichannelRightContainer}>
						<Switch value={status} onValueChange={toggleLivechat} />
					</View>
				)}
			/>
			<List.Separator />
			{status ? <OmnichannelQueue queueSize={queueSize} onPress={goQueue} /> : null}
		</>
	);
});

export default OmnichannelStatus;
