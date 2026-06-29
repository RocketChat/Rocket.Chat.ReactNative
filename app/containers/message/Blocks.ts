import { createElement, useContext } from 'react';

import { messageBlockWithContext } from '../UIKit/MessageBlock';
import { type IMessageBlocks } from './interfaces';
import MessageContext from './Context';

const Blocks = ({ blocks, id: mid, rid }: IMessageBlocks) => {
	'use memo';

	const { blockAction } = useContext(MessageContext);

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
