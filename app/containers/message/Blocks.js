import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

const Blocks = React.memo(({ blocks, id, rid }) => {
	if (blocks && blocks.lenght > 0) {
		return (
			<View>
				<Text>{id}</Text>
				<Text>{rid}</Text>
				{blocks.map(block => <Text>{JSON.stringify(block)}</Text>)}
			</View>
		);
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
