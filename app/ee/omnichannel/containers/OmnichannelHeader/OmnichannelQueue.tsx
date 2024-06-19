import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../../../theme';
import { themes } from '../../../../lib/constants';
import { CustomIcon } from '../../../../containers/CustomIcon';
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
				left={() => <List.Icon name='queue' size={24} color={themes[theme].fontHint} />}
				color={themes[theme].fontDefault}
				onPress={queueSize ? onPress : undefined}
				styleTitle={styles.titleOmnichannelQueue}
				right={() => (
					<View style={styles.omnichannelRightContainer}>
						{queueSize ? (
							<>
								<UnreadBadge
									style={[styles.queueIcon, { backgroundColor: themes[theme].badgeBackgroundLevel2 }]}
									unread={queueSize}
								/>
								<CustomIcon name='chevron-right' style={styles.actionIndicator} color={themes[theme].fontDefault} size={24} />
							</>
						) : (
							<Text style={[styles.emptyText, { color: themes[theme].fontHint }]}>{i18n.t('Empty')}</Text>
						)}
					</View>
				)}
			/>
			<List.Separator />
		</>
	);
};

export default OmnichannelQueue;
