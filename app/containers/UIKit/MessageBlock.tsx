import React from 'react';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';
import getBlockValueString from '../../lib/methods/getBlockValueString';

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
		? renderedBlocks.map((element, index) => {
				const key = `${element.type || 'MESSAGE_BLOCK'}-${getBlockValueString(
					element.value || element.id || blocks[index]?.blockId
				)}-${index}`;
				return <React.Fragment key={key}>{element}</React.Fragment>;
		  })
		: renderedBlocks;
};

export const modalBlockWithContext = (context: any) => (data: any) =>
	(
		<KitContext.Provider value={{ ...context, ...data }}>
			<ModalBlock {...data} />
		</KitContext.Provider>
	);

const ModalBlock = ({ blocks }: any) => UiKitModal(blocks);
