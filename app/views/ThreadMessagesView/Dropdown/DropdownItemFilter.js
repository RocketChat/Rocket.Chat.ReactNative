import React from 'react';
import PropTypes from 'prop-types';

import DropdownItem from './DropdownItem';
import I18n from '../../../i18n';

const DropdownItemFilter = ({ currentFilter, value, onPress }) => (
	<DropdownItem
		text={I18n.t(value)}
		iconName={currentFilter === value ? 'check' : null}
		onPress={() => onPress(value)}
	/>
);

DropdownItemFilter.propTypes = {
	currentFilter: PropTypes.string,
	value: PropTypes.string,
	onPress: PropTypes.func
};

export default DropdownItemFilter;
