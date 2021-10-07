import React, { memo, useState, useEffect } from 'react';
import { View, Switch } from 'react-native';
import PropTypes from 'prop-types';

import * as List from '../../../containers/List';
import styles from '../../../views/RoomsListView/styles';
import { themes, SWITCH_TRACK_COLOR } from '../../../constants/colors';
import { withTheme } from '../../../theme';
import UnreadBadge from '../../../presentation/UnreadBadge';
import RocketChat from '../../../lib/rocketchat';
import { isOmnichannelStatusAvailable, changeLivechatStatus } from '../lib';

const OmnichannelStatus = memo(({
	searching, goQueue, theme, queueSize, inquiryEnabled, user
}) => {
	if (searching > 0 || !(RocketChat.isOmnichannelModuleAvailable() && user?.roles?.includes('livechat-agent'))) {
		return null;
	}
	const [status, setStatus] = useState(isOmnichannelStatusAvailable(user));

	useEffect(() => {
		setStatus(isOmnichannelStatusAvailable(user));
	}, [user.statusLivechat]);

	const toggleLivechat = async() => {
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
						{inquiryEnabled
							? (
								<UnreadBadge
									style={styles.queueIcon}
									unread={queueSize}
								/>
							)
							: null}
						<Switch
							value={status}
							trackColor={SWITCH_TRACK_COLOR}
							onValueChange={toggleLivechat}
						/>
					</View>
				)}
			/>
			<List.Separator />
		</>
	);
});

OmnichannelStatus.propTypes = {
	searching: PropTypes.bool,
	goQueue: PropTypes.func,
	queueSize: PropTypes.number,
	inquiryEnabled: PropTypes.bool,
	theme: PropTypes.string,
	user: PropTypes.shape({
		roles: PropTypes.array,
		statusLivechat: PropTypes.string
	})
};

export default withTheme(OmnichannelStatus);
