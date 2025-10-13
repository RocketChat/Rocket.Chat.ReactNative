import React, { memo, useEffect, useState } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import I18n from '../../i18n';
import { MarkdownPreview } from '../markdown';
import { IMessageRepliedThread } from './interfaces';
import { useTheme } from '../../theme';
import { AvatarContainer } from './MessageAvatar';

const RepliedThread = memo(({ tmid, tmsg, isHeader, fetchThreadName, id, isEncrypted }: IMessageRepliedThread) => {
	'use memo';

	const { colors } = useTheme();
	const [msg, setMsg] = useState(isEncrypted ? I18n.t('Encrypted_message') : tmsg);

	useEffect(() => {
		if (!msg) {
			fetch();
		}
	}, []);

	if (!tmid || !isHeader) {
		return null;
	}

	const fetch = async () => {
		const threadName = fetchThreadName ? await fetchThreadName(tmid, id) : '';
		setMsg(threadName);
	};

	if (!msg) {
		return null;
	}

	return (
		<View style={styles.repliedThread} testID={`message-thread-replied-on-${msg}`}>
			<AvatarContainer>
				<CustomIcon name='threads' size={20} color={colors.fontInfo} />
			</AvatarContainer>
			<MarkdownPreview msg={msg} style={[styles.repliedThreadName, { color: colors.fontInfo }]} />
			<View style={styles.repliedThreadDisclosure}>
				<CustomIcon name='chevron-right' color={colors.fontSecondaryInfo} size={20} />
			</View>
		</View>
	);
});

RepliedThread.displayName = 'MessageRepliedThread';

export default RepliedThread;
