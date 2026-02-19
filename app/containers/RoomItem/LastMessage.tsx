import { dequal } from 'dequal';
import React from 'react';
import { type TextStyle } from 'react-native';

import { formatLastMessage } from '../../lib/methods/formatLastMessage';
import { isAndroid } from '../../lib/methods/helpers';
import { useTheme } from '../../theme';
import { MarkdownPreview } from '../markdown';
import { type ILastMessageProps } from './interfaces';

const arePropsEqual = (oldProps: any, newProps: any) => dequal(oldProps, newProps);

const LastMessage = React.memo(({ lastMessage, type, showLastMessage, username, alert, useRealName }: ILastMessageProps) => {
	const { colors } = useTheme();
	// Android has a bug with the text align on the markdown preview
	const alignSelf: TextStyle = isAndroid ? { alignSelf: 'stretch', width: '100%' } : { width: '100%' };

	return (
		<MarkdownPreview
			msg={formatLastMessage({
				lastMessage,
				type,
				showLastMessage,
				username,
				useRealName
			})}
			style={[{ color: alert ? colors.fontDefault : colors.fontSecondaryInfo }, alignSelf]}
			numberOfLines={2}
		/>
	);
}, arePropsEqual);

export default LastMessage;
