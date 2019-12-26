/* eslint-disable react/prop-types */
import React from 'react';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

const contextDefault = {
	action: () => console.log('cachorro'),
	state: (data) => {
		console.log('state', data);
	}
};

export const messageBlockWithContext = context => ({ blocks }) => (
	<KitContext.Provider value={context}>
		<UiKitMessage blocks={blocks} />
	</KitContext.Provider>
);

export const modalBlockWithContext = context => ({ blocks }) => (
	<KitContext.Provider value={context}>
		<UiKitModal blocks={blocks} />
	</KitContext.Provider>
);

export const MessageBlock = (props, context = contextDefault) => (
	<KitContext.Provider value={context}>
		{UiKitMessage(props)}
	</KitContext.Provider>
);
