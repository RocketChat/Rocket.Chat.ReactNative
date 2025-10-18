import React, { useEffect } from 'react';

import Status from './Status';
import { IStatus } from './definition';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserPresence } from '../../lib/methods/getUsersPresence';
import { StyleProp, TextStyle } from 'react-native';
import { parse } from '@rocket.chat/message-parser';
import Markdown from '../../containers/markdown';

interface IStatusTextContainer {
    status: string;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
}

const StatusTextContainer = ({ status, style, numberOfLines = 1 }: IStatusTextContainer): React.ReactElement => {
	const customEmojis = useAppSelector(state => state.customEmojis);
    
    const getCustomEmoji = (emoji: string) => {
        const customEmoji = customEmojis?.[emoji];
        if (customEmoji) {
            return customEmoji;
        }
        return null;
    };

	return <Markdown msg={status} numberOfLines={numberOfLines} getCustomEmoji={getCustomEmoji} style={[style]}/>;
};

export default StatusTextContainer;
