import React from 'react';
import PropTypes from 'prop-types';

import DropdownItem from './DropdownItem';

const DropdownItemHeader = ({ department, onPress }) => (
	<DropdownItem text={department?.name} iconName='filter' onPress={onPress} />
);

DropdownItemHeader.propTypes = {
	department: PropTypes.object,
	onPress: PropTypes.func
};

export default DropdownItemHeader;
