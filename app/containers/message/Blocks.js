import React from 'react';
import PropTypes from 'prop-types';
import { messageBlockWithContext } from '../UIKit/MessageBlock';
import RocketChat from '../../lib/rocketchat';

const Blocks = React.memo(({ blocks, id: mid, rid }) => {
	if (blocks && blocks.length > 0) {
		const [, secondBlock] = blocks;
		const { appId = '' } = secondBlock;
		return React.createElement(messageBlockWithContext({
			action: ({ actionId, value, blockId }) => RocketChat.triggerBlockAction({
				actionId, appId, value, blockId, rid, mid
			}),
			appId,
			rid
		}), { blocks });
	}
	return null;
});

Blocks.propTypes = {
	blocks: PropTypes.array,
	id: PropTypes.string,
	rid: PropTypes.string
};
Blocks.displayName = 'MessageBlocks';

export default Blocks;
