/* eslint-disable react/prop-types */
import React, { useContext } from 'react';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

import {
	UiKitMessage,
	UiKitModal,
	messageParser,
	modalParser
} from './index';
import { KitContext } from './utils';
import Markdown from '../markdown';
import { ThemeContext } from '../../theme';
import { themes } from '../../constants/colors';

messageParser.text = ({ text, type } = { text: '' }, context) => {
	const { theme } = useContext(ThemeContext);
	if (type !== 'mrkdwn') {
		return text;
	}

	const isContext = context === BLOCK_CONTEXT.CONTEXT;
	return (
		<Markdown
			msg={text}
			theme={theme}
			style={[isContext && { color: themes[theme].auxiliaryText }]}
			preview={isContext}
		/>
	);
};

modalParser.text = messageParser.text;

const contextDefault = {
	action: console.log,
	state: console.log
};

export const messageBlockWithContext = context => ({ blocks }) => (
	<KitContext.Provider value={context}>
		{UiKitMessage(blocks)}
	</KitContext.Provider>
);

export const modalBlockWithContext = context => ({ blocks }) => (
	<KitContext.Provider value={context}>
		{UiKitModal(blocks)}
	</KitContext.Provider>
);

export const MessageBlock = (props, context = contextDefault) => (
	<KitContext.Provider value={context}>
		{UiKitMessage(props)}
	</KitContext.Provider>
);
