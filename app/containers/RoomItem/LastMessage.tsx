import { dequal } from 'dequal';
import React from 'react';
import { TextStyle } from 'react-native';

import { formatLastMessage } from '../../lib/methods/formatLastMessage';
import { isAndroid } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import { MarkdownPreview } from '../markdown';
import { ILastMessageProps } from './interfaces';
import styles from './styles';

const arePropsEqual = (oldProps: any, newProps: any) => dequal(oldProps, newProps);

const LastMessage = React.memo(({ lastMessage, type, showLastMessage, username, alert, useRealName }: ILastMessageProps) => {
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
}, arePropsEqual);

export default LastMessage;
