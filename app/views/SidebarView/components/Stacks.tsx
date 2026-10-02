import { Fragment } from 'react';

import * as List from '~/containers/List';
import StackItem from './StackItem';
import { useStackItems } from './useStackItems';

const Stacks = ({ currentScreen }: { currentScreen: string | null }) => {
	const items = useStackItems(currentScreen);

	return (
		<>
			{items.map(item => (
				<Fragment key={item.testID}>
					<StackItem item={item} />
					<List.Separator />
				</Fragment>
			))}
		</>
	);
};
export default Stacks;
