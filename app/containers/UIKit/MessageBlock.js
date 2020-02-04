/* eslint-disable react/prop-types */
import React from 'react';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

export const messageBlockWithContext = context => ({ blocks }) => (
	<KitContext.Provider value={context}>
		{UiKitMessage(blocks)}
	</KitContext.Provider>
);

export const modalBlockWithContext = context => ({ blocks, ...data }) => (
	<KitContext.Provider value={{ ...context, ...data }}>
		{UiKitModal(blocks)}
	</KitContext.Provider>
);
