import React from 'react';
import { UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';

import Inline from './Inline';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

const UnorderedList: React.FC<IUnorderedListProps> = ({ value }) => (
	<>
		{value.map(item => (
			<Inline value={item.value} />
		))}
	</>
);

export default UnorderedList;
