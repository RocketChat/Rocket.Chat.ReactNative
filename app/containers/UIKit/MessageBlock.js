import React from 'react';
import PropTypes from 'prop-types';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

export const messageBlockWithContext = context => props => (
	<KitContext.Provider value={context}>
		<MessageBlock {...props} />
	</KitContext.Provider>
);

const MessageBlock = ({ blocks }) => UiKitMessage(blocks);
MessageBlock.propTypes = {
	blocks: PropTypes.any
};

export const modalBlockWithContext = context => data => (
	<KitContext.Provider value={{ ...context, ...data }}>
		<ModalBlock {...data} />
	</KitContext.Provider>
);

const ModalBlock = ({ blocks }) => UiKitModal(blocks);
ModalBlock.propTypes = {
	blocks: PropTypes.any
};
