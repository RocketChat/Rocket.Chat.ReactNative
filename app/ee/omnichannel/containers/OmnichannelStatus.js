import React, { memo, useState, useEffect } from 'react';
import {
	View, Text, StyleSheet, Switch
} from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../../utils/touch';
import { CustomIcon } from '../../../lib/Icons';
import I18n from '../../../i18n';
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
		<Touch
			onPress={goQueue}
			theme={theme}
			style={{ backgroundColor: themes[theme].headerSecondaryBackground }}
		>
			<View
				style={[
					styles.dropdownContainerHeader,
					{ borderBottomWidth: StyleSheet.hairlineWidth, borderColor: themes[theme].separatorColor }
				]}
			>
				<CustomIcon style={[styles.queueIcon, { color: themes[theme].auxiliaryText }]} size={22} name='omnichannel' />
				<Text style={[styles.queueToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t('Omnichannel')}</Text>
				{inquiryEnabled
					? (
						<UnreadBadge
							style={styles.queueIcon}
							unread={queueSize}
						/>
					)
					: null}
				<Switch
					style={styles.omnichannelToggle}
					value={status}
					trackColor={SWITCH_TRACK_COLOR}
					onValueChange={toggleLivechat}
				/>
			</View>
		</Touch>
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
