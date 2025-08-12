import React, { memo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { shallowEqual } from 'react-redux';

import * as List from '../../../../containers/List';
import styles from './styles';
import { useTheme } from '../../../../theme';
import { showConfirmationAlert } from '../../../../lib/methods/helpers/info';
import i18n from '../../../../i18n';
import { changeLivechatStatus, isOmnichannelStatusAvailable } from '../../lib';
import OmnichannelQueue from './OmnichannelQueue';
import { isOmnichannelModuleAvailable } from '../../../../lib/methods';
import Switch from '../../../../containers/Switch';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../../../selectors/login';
import { events, logEvent } from '../../../../lib/methods/helpers/log';
import { getInquiryQueueSelector } from '../../selectors/inquiry';

const OmnichannelStatus = memo(() => {
	const { colors } = useTheme();
	const { roles, statusLivechat } = useAppSelector(state => getUserSelector(state), shallowEqual);
	const inquiryEnabled = useAppSelector(state => state.inquiry.enabled);
	const queueSize = useAppSelector(state => getInquiryQueueSelector(state).length);
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const navigation = useNavigation<any>();

	if (!(isOmnichannelModuleAvailable() && roles?.includes('livechat-agent'))) {
		return null;
	}

	const toggleLivechat = async () => {
		if (!isOmnichannelStatusAvailable(statusLivechat)) {
			showConfirmationAlert({
				message: i18n.t('Omnichannel_enable_alert'),
				confirmationText: i18n.t('Yes'),
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
				await changeLivechatStatus();
			} catch {
				// Do nothing
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
				additionalAcessibilityLabel={statusLivechat}
				right={() => (
					<View style={styles.omnichannelRightContainer}>
						<Switch value={isOmnichannelStatusAvailable(statusLivechat)} onValueChange={toggleLivechat} />
					</View>
				)}
			/>
			<List.Separator />
			{isOmnichannelStatusAvailable(statusLivechat) ? <OmnichannelQueue queueSize={queueSize} onPress={goQueue} /> : null}
		</>
	);
});

export default OmnichannelStatus;
