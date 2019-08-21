import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

export default class List extends PureComponent {
	static propTypes = {
		children: PropTypes.node,
		ordered: PropTypes.bool,
		start: PropTypes.number,
		tight: PropTypes.bool
	};

	render() {
		const {
			children, ordered, start, tight
		} = this.props;
		let bulletWidth = 15;

		if (ordered) {
			const lastNumber = (start + children.length) - 1;
			bulletWidth = (9 * lastNumber.toString().length) + 7;
		}

		const _children = React.Children.map(children, (child, index) => React.cloneElement(child, {
			bulletWidth,
			ordered,
			tight,
			index
		}));

		return (
			<React.Fragment>
				{_children}
			</React.Fragment>
		);
	}
}
