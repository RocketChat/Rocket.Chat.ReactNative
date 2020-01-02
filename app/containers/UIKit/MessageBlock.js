/* eslint-disable react/prop-types */
import React from 'react';

import {
	UiKitMessage,
	UiKitModal,
	messageParser,
	modalParser
} from './index';
import { KitContext } from './utils';
import Markdown from '../markdown';

messageParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <Markdown msg={text} theme='light' />;
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
