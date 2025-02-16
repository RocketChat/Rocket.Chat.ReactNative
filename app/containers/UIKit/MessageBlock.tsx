import React, { type ContextType } from 'react';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext, type IKitContext } from './utils';

export const messageBlockWithContext = (context: ContextType<typeof KitContext>) => function MessageBlockWithContext(props: { blocks: { type: string }[] } & Partial<IKitContext>) {
	return (
		<KitContext.Provider value={context}>
			<MessageBlock {...props} />
		</KitContext.Provider>
	);
}

const MessageBlock = ({ blocks }: { blocks: { type: string }[] }) => UiKitMessage(blocks);

export const modalBlockWithContext = (context: ContextType<typeof KitContext>) => function ModalBlockWithContext(props: { blocks: { type: string }[] } & Partial<IKitContext>) {
	return (
		<KitContext.Provider value={{ ...context, ...props }}>
			<ModalBlock {...props} />
		</KitContext.Provider>
	);
}

const ModalBlock = ({ blocks }: { blocks: { type: string }[] }) => UiKitModal(blocks);
