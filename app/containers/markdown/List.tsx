import React from 'react';

interface IList {
	children: JSX.Element;
	ordered: boolean;
	start: number;
	tight: boolean;
	numberOfLines?: number;
}

const List = React.memo(({ children, ordered, tight, start = 1, numberOfLines = 0 }: IList) => {
	let bulletWidth = 15;

	if (ordered) {
		// @ts-ignore
		const lastNumber = start + children.length - 1;
		bulletWidth = 9 * lastNumber.toString().length + 7;
	}

	let items = React.Children.toArray(children);

	if (numberOfLines) {
		items = items.slice(0, numberOfLines);
	}

	const _children = items.map((child: any, index: number) =>
		React.cloneElement(child, {
			bulletWidth,
			ordered,
			tight,
			index: start + index
		})
	);

	return <>{_children}</>;
});

export default List;
