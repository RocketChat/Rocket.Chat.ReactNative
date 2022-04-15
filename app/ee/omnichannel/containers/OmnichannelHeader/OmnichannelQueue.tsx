import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants';
import { CustomIcon } from '../../../../lib/Icons';
import * as List from '../../../../containers/List';
import styles from './styles';
import UnreadBadge from '../../../../containers/UnreadBadge';
import i18n from '../../../../i18n';

interface IOmnichannelQueue {
	queueSize?: number;
	onPress(): void;
}

const OmnichannelQueue = ({ queueSize, onPress }: IOmnichannelQueue) => {
	const { theme } = useTheme();
	return (
		<>
			<List.Item
				title='Omnichannel_queue'
				heightContainer={50}
				left={() => <List.Icon name='queue' size={24} color={themes[theme].auxiliaryTintColor} />}
				color={themes[theme].bodyText}
				onPress={queueSize ? onPress : undefined}
				styleTitle={styles.titleOmnichannelQueue}
				right={() => (
					<View style={styles.omnichannelRightContainer}>
						{queueSize ? (
							<>
								<UnreadBadge style={[styles.queueIcon, { backgroundColor: themes[theme].tintColor }]} unread={queueSize} />
								<CustomIcon name='chevron-right' style={styles.actionIndicator} color={themes[theme].bodyText} size={24} />
							</>
						) : (
							<Text style={[styles.emptyText, { color: themes[theme].auxiliaryTintColor }]}>{i18n.t('Empty')}</Text>
						)}
					</View>
				)}
			/>
			<List.Separator />
		</>
	);
};

export default OmnichannelQueue;
