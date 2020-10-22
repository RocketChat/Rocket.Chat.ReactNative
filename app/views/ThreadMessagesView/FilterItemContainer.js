import React from 'react';

import FilterItem from './FilterItem';

const FilterItemContainer = ({ currentFilter, value, onPress }) => {
	return (
		<FilterItem
			text={value}
			iconName={currentFilter === value ? 'check' : null}
			onPress={() => onPress(value)}
		/>
	);
};

export default FilterItemContainer;
