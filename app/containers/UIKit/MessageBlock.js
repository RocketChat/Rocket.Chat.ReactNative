/* eslint-disable react/prop-types */
import React, { useContext } from 'react';

import {
	UiKitMessage,
	UiKitModal,
	messageParser,
	modalParser
} from './index';
import { KitContext } from './utils';
import Markdown from '../markdown';
import { ThemeContext } from '../../theme';


messageParser.text = ({ text, type } = {}) => {
	const { theme } = useContext(ThemeContext);
	if (type !== 'mrkdwn') {
		return text;
	}

	return <Markdown msg={text} theme={theme} />;
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
