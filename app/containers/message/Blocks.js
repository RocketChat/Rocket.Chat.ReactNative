import React from 'react';
import PropTypes from 'prop-types';
import { messageBlockWithContext } from '../UIKit/MessageBlock';
import RocketChat from '../../lib/rocketchat';

const mockBlocks = [
	{
		type: 'section',
		text: {
			type: 'plain_text',
			text: 'Choose an action'
		},
		blockId: '6186484c-e359-411a-9175-5c3ebf0017cd',
		appId: 'c33fa1a6-68a7-491e-bf49-9d7b99671c48'
	},
	{
		type: 'actions',
		elements: [
			{
				type: 'button',
				text: {
					type: 'plain_text',
					text: 'Create poll'
				},
				actionId: 'create',
				value: 'GENERAL'
			}
		],
		blockId: '74fa4c2a-1ee9-4669-86bb-6d882a51af29',
		appId: 'c33fa1a6-68a7-491e-bf49-9d7b99671c48'
	}
];

const Blocks = React.memo(({ id, rid }) => {
	if (mockBlocks) {
		return React.createElement(messageBlockWithContext({
			action: async(options) => {
				const {
					appId, actionId, value, blockId
				} = options;
				await RocketChat.triggerBlockAction({
					actionId, appId, value, blockId, rid, mid: id
				});
			},
			appId: '123',
			rid
		}), { blocks: mockBlocks });
	}
	return null;
});

Blocks.propTypes = {
	// blocks: PropTypes.array,
	id: PropTypes.string,
	rid: PropTypes.string
};
Blocks.displayName = 'MessageBlocks';

export default Blocks;
