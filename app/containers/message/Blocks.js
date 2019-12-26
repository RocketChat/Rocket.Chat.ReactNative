import React from 'react';
import PropTypes from 'prop-types';
import { messageBlockWithContext } from '../UIKit/MessageBlock';
import RocketChat from '../../lib/rocketchat';

const Blocks = React.memo(({ blocks, id, rid }) => {
	if (blocks && blocks.length > 0) {
		return React.createElement(messageBlockWithContext({
			action: ({
				appId, actionId, value, blockId
			}) => RocketChat.triggerBlockAction({
				actionId, appId, value, blockId, rid, mid: id
			}),
			appId: '123',
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
