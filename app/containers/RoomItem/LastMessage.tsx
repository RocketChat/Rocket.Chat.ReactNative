import { dequal } from 'dequal';
import type { TextStyle } from 'react-native';
import { memo } from 'react';

import { formatLastMessage } from '../../lib/methods/formatLastMessage';
import { isAndroid } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import { MarkdownPreview } from '../markdown';
import type { ILastMessageProps } from './interfaces';
import styles from './styles';

const LastMessage = ({ lastMessage, type, showLastMessage, username, alert, useRealName }: ILastMessageProps) => {
	const { colors } = useTheme();
	// Android has a bug with the text align on the markdown preview
	const alignSelf: TextStyle = isAndroid ? { alignSelf: 'stretch' } : {};

	return (
		<MarkdownPreview
			msg={formatLastMessage({
				lastMessage,
				type,
				showLastMessage,
				username,
				useRealName
			})}
			style={[styles.markdownText, { color: alert ? colors.fontDefault : colors.fontSecondaryInfo }, alignSelf]}
			numberOfLines={2}
		/>
	);
};

export default memo(LastMessage, dequal);
