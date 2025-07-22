import React, { memo, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import * as List from '../../../../containers/List';
import styles from './styles';
import { useTheme } from '../../../../theme';
import { showConfirmationAlert } from '../../../../lib/methods/helpers/info';
import I18n from '../../../../i18n';
import { changeLivechatStatus, isOmnichannelStatusAvailable } from '../../lib';
import OmnichannelQueue from './OmnichannelQueue';
import { isOmnichannelModuleAvailable } from '../../../../lib/methods';
import Switch from '../../../../containers/Switch';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../../selectors/login';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { getInquiryQueueSelector } from '../../selectors/inquiry';

interface IOmnichannelStatus {
	searching: boolean;
}

const OmnichannelStatus = memo(({ searching }: IOmnichannelStatus) => {
	const { colors } = useTheme();
	const { roles, statusLivechat } = useAppSelector(state => getUserSelector(state));
	const [status, setStatus] = useState(isOmnichannelStatusAvailable(statusLivechat));
	const inquiryEnabled = useAppSelector(state => state.inquiry.enabled);
	const queueSize = useAppSelector(state => getInquiryQueueSelector(state).length);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation<any>();

	useEffect(() => {
		setStatus(isOmnichannelStatusAvailable(statusLivechat));
	}, [statusLivechat]);

	if (searching || !(isOmnichannelModuleAvailable() && roles?.includes('livechat-agent'))) {
		return null;
	}

	const toggleLivechat = async () => {
		if (!isOmnichannelStatusAvailable(statusLivechat)) {
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

	const goQueue = () => {
		logEvent(events.RL_GO_QUEUE);

		if (!inquiryEnabled) {
			return;
		}

		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'QueueListView' });
		} else {
			navigation.navigate('QueueListView');
		}
	};

	return (
		<>
			<List.Item
				title='Omnichannel'
				color={colors.fontDefault}
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
