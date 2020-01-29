/* eslint-disable react/prop-types */
import React from 'react';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

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
