import React from 'react';

import { messageBlockWithContext } from '../UIKit/MessageBlock';
import { IMessageBlocks } from './interfaces';

const Blocks = React.memo(({ blocks, id: mid, rid, blockAction }: IMessageBlocks) => {
	if (blocks && blocks.length > 0) {
		const appId = blocks[0]?.appId || '';
		return React.createElement(
			messageBlockWithContext({
				action: async ({ actionId, value, blockId }: any) => {
					await blockAction({
						actionId,
						appId,
						value,
						blockId,
						rid,
						mid
					});
				},
				appId,
				rid
			}),
			{ blocks }
		);
	}
	return null;
});

Blocks.displayName = 'MessageBlocks';

export default Blocks;
