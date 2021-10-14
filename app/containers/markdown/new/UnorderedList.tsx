import React from 'react';
import { UnorderedList as UnorderedListProps } from '@rocket.chat/message-parser';

import Inline from './Inline';

interface IUnorderedListProps {
	value: UnorderedListProps['value'];
}

const UnorderedList = ({ value }: IUnorderedListProps): JSX.Element => (
	<>
		{value.map(item => (
			<Inline value={item.value} />
		))}
	</>
);

export default UnorderedList;
