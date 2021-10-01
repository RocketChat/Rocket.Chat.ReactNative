import React from 'react';
import PropTypes from 'prop-types';

import DropdownItem from './DropdownItem';

const DropdownItemFilter = ({ currentDepartment, value, onPress }) => (
	<DropdownItem
		text={value?.name}
		iconName={currentDepartment?._id === value?._id ? 'check' : null}
		onPress={() => onPress(value)}
	/>
);

DropdownItemFilter.propTypes = {
	currentDepartment: PropTypes.object,
	value: PropTypes.string,
	onPress: PropTypes.func
};

export default DropdownItemFilter;
