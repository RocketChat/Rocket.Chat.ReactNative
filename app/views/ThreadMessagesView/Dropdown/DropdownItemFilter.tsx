import React from 'react';

import I18n from '../../../i18n';
import DropdownItem from './DropdownItem';

interface IDropdownItemFilter {
	currentFilter: string;
	value: string;
	onPress: (value: string) => void;
}

const DropdownItemFilter = ({ currentFilter, value, onPress }: IDropdownItemFilter): JSX.Element => (
	<DropdownItem text={I18n.t(value)} iconName={currentFilter === value ? 'check' : null} onPress={() => onPress(value)} />
);

export default DropdownItemFilter;
