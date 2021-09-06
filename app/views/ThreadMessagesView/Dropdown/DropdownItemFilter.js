import React from 'react';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import DropdownItem from './DropdownItem';

const DropdownItemFilter = ({ currentFilter, value, onPress }) => (
	<DropdownItem text={I18n.t(value)} iconName={currentFilter === value ? 'check' : null} onPress={() => onPress(value)} />
);

DropdownItemFilter.propTypes = {
	currentFilter: PropTypes.string,
	value: PropTypes.string,
	onPress: PropTypes.func
};

export default DropdownItemFilter;
