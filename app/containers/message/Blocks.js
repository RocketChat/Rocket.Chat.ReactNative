import React from 'react';
import PropTypes from 'prop-types';
import { messageBlockWithContext } from '../UIKit/MessageBlock';

const Blocks = React.memo(({
	blocks, id: mid, rid, blockAction
}) => {
	if (blocks && blocks.length > 0) {
		const appId = blocks[0]?.appId || '';
		return React.createElement(
			messageBlockWithContext({
				action: async({ actionId, value, blockId }) => {
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
			}), { blocks }
		);
	}
	return null;
});

Blocks.propTypes = {
	blocks: PropTypes.array,
	id: PropTypes.string,
	rid: PropTypes.string,
	blockAction: PropTypes.func
};
Blocks.displayName = 'MessageBlocks';

export default Blocks;
