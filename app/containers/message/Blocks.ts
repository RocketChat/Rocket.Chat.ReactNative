import React from 'react';

import { messageBlockWithContext } from '../UIKit/MessageBlock';
import { IMessageBlocks } from './interfaces';

const Blocks = React.memo(
	({ blocks, id: mid, rid, blockAction }: IMessageBlocks) => {
		if (blocks && blocks.length > 0) {
			const appId = blocks[0]?.appId || '';
			return React.createElement(
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
	},
	(prevProps, nextProps) => {
		if (
			// @ts-ignore
			('type' in prevProps.blocks[0] && prevProps.blocks[0].type === 'video_conf') ||
			// @ts-ignore
			('type' in nextProps.blocks[0] && nextProps.blocks[0].type === 'video_conf')
		) {
			// Avoid multiple request on the VideoConferenceBlock
			return true;
		}
		return false;
	}
);

Blocks.displayName = 'MessageBlocks';

export default Blocks;
