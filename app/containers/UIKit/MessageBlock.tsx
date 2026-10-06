import { Fragment, type ReactElement } from 'react';

import { UiKitMessage, UiKitModal } from './index';
import { KitContext } from './utils';

const keyByPosition = (renderedBlocks: ReactElement[]) =>
	renderedBlocks.map((renderedBlock, position) => <Fragment key={position}>{renderedBlock}</Fragment>);

const MessageBlockContent = ({ blocks }: any) => keyByPosition(UiKitMessage(blocks));

export const MessageBlock = ({ blocks, context }: any) => (
	<KitContext.Provider value={context}>
		<MessageBlockContent blocks={blocks} />
	</KitContext.Provider>
);

export const ModalBlockWithContext = (props: any) => (
	<KitContext.Provider value={props}>
		<ModalBlock blocks={props.blocks} />
	</KitContext.Provider>
);

const ModalBlock = ({ blocks }: any) => keyByPosition(UiKitModal(blocks));
