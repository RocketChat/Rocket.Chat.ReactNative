import { createElement } from 'react';

import { messageBlockWithContext } from '../../UIKit/MessageBlock';
import { useBlockAction, useRid } from '../stores/MessageRoomStore';
import { useBlocks } from '../stores/MessageStore';

const Blocks = () => {
	'use memo';

	const rid = useRid();
	const blockAction = useBlockAction();
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
							rid: rid ?? '',
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
