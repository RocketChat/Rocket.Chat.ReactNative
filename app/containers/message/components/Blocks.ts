import { createElement } from 'react';

import { MessageBlock } from '~/containers/UIKit/MessageBlock';
import { useRid, useBlockAction } from '../stores/MessageRoomStore';
import { useBlocks } from '../stores/MessageStore';

const Blocks = () => {
	const rid = useRid();
	const blockAction = useBlockAction();
	const { blocks, id: mid } = useBlocks();

	if (blocks && blocks.length > 0) {
		const defaultAppId = blocks.find(b => b?.appId)?.appId || blocks[0]?.appId || '';
		return createElement(MessageBlock, {
			blocks,
			context: {
				action: async ({
					actionId,
					value,
					blockId,
					appId: actionAppId
				}: {
					actionId: string;
					value: string;
					blockId: string;
					appId?: string;
				}) => {
					if (blockAction) {
						await blockAction({
							actionId,
							appId: actionAppId || defaultAppId,
							value,
							blockId,
							rid: rid ?? '',
							mid
						});
					}
				},
				appId: defaultAppId,
				rid
			}
		});
	}
	return null;
};

export default Blocks;
