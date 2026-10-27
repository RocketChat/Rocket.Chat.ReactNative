import { createElement } from 'react';

import { MessageBlock } from '~/containers/UIKit/MessageBlock';
import { useRid, useBlockAction } from '../stores/MessageRoomStore';
import { useBlocks } from '../stores/MessageStore';

const Blocks = () => {
	const rid = useRid();
	const blockAction = useBlockAction();
	const { blocks, id: mid } = useBlocks();

	if (blocks && blocks.length > 0) {
		const appId = blocks[0]?.appId || '';
		return createElement(MessageBlock, {
			blocks,
			context: {
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
			}
		});
	}
	return null;
};

export default Blocks;
