import { createElement, useContext } from 'react';

import { messageBlockWithContext } from '../UIKit/MessageBlock';
import { type IMessageBlocks } from './interfaces';
import MessageContext from './Context';
import { useBlocks } from './MessageStore';

const Blocks = ({ rid }: IMessageBlocks) => {
	'use memo';

	const { blockAction } = useContext(MessageContext);
	const { blocks, id: mid } = useBlocks();

	if (blocks && blocks.length > 0) {
		const appId = blocks[0]?.appId || '';
		return createElement(
			messageBlockWithContext({
				action: async ({ actionId, value, blockId }: { actionId: string; value: string; blockId: string }) => {
					if (blockAction) {
						await blockAction({
							actionId,
							appId,
							value,
							blockId,
							rid,
							mid
						});
					}
				},
				appId,
				rid
			}),
			{ blocks }
		);
	}
	return null;
};

Blocks.displayName = 'MessageBlocks';

export default Blocks;
