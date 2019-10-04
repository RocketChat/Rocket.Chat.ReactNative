import PropTypes from 'prop-types';
import React from 'react';

const List = React.memo(({
	children, ordered, start, tight, numberOfLines = 0
}) => {
	let bulletWidth = 15;

	if (ordered) {
		const lastNumber = (start + children.length) - 1;
		bulletWidth = (9 * lastNumber.toString().length) + 7;
	}

	let items = React.Children.toArray(children);

	if (numberOfLines) {
		items = items.slice(0, numberOfLines);
	}

	const _children = items.map((child, index) => React.cloneElement(child, {
		bulletWidth,
		ordered,
		tight,
		index: start + index
	}));

	return (
		<>
			{_children}
		</>
	);
});

List.propTypes = {
	children: PropTypes.node,
	ordered: PropTypes.bool,
	start: PropTypes.number,
	tight: PropTypes.bool,
	numberOfLines: PropTypes.number
};

List.defaultProps = {
	start: 1
};

export default List;
