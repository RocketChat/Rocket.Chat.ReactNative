import React from 'react';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

export const messageBlockWithContext = (context: any) => (props: any) =>
	(
		<KitContext.Provider value={context}>
			<MessageBlock {...props} />
		</KitContext.Provider>
	);

const MessageBlock = ({ blocks }: any) => {
	if (!blocks) return null;
	const renderedBlocks = UiKitMessage(blocks);
	return Array.isArray(renderedBlocks)
		? renderedBlocks.map(element => <React.Fragment key={element.props.blockId}>{element}</React.Fragment>)
		: renderedBlocks;
};

export const modalBlockWithContext = (context: any) => (data: any) =>
	(
		<KitContext.Provider value={{ ...context, ...data }}>
			<ModalBlock {...data} />
		</KitContext.Provider>
	);

const ModalBlock = ({ blocks }: any) => UiKitModal(blocks);
