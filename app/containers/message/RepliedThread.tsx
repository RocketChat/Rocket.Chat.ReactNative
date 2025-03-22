import React, { memo, useEffect, useState } from 'react';
import { View } from 'react-native';

import { CustomIcon } from '../CustomIcon';
import styles from './styles';
import { themes } from '../../lib/constants';
import I18n from '../../i18n';
import { MarkdownPreview } from '../markdown';
import { IMessageRepliedThread } from './interfaces';
import { useTheme } from '../../theme';

const RepliedThread = memo(({ tmid, tmsg, isHeader, fetchThreadName, id, isEncrypted }: IMessageRepliedThread) => {
	const { theme } = useTheme();
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
			<CustomIcon name='threads' size={20} style={styles.repliedThreadIcon} color={themes[theme].fontInfo} />
			<MarkdownPreview msg={msg} style={[styles.repliedThreadName, { color: themes[theme].fontInfo }]} />
			<View style={styles.repliedThreadDisclosure}>
				<CustomIcon name='chevron-right' color={themes[theme].fontSecondaryInfo} size={20} />
			</View>
		</View>
	);
});

RepliedThread.displayName = 'MessageRepliedThread';

export default RepliedThread;
