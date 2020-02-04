import React from 'react';
import PropTypes from 'prop-types';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

export const messageBlockWithContext = context => ({ blocks }) => (
	<KitContext.Provider value={context}>
		{UiKitMessage(blocks)}
	</KitContext.Provider>
).propTypes = {
	blocks: PropTypes.any
};

export const modalBlockWithContext = context => ({ blocks }) => (
	<KitContext.Provider value={context}>
		{UiKitModal(blocks)}
	</KitContext.Provider>
).propTypes = {
	blocks: PropTypes.any
};
