import React from 'react';

import { IDepartment } from '../../../definitions/ICannedResponse';
import DropdownItem from './DropdownItem';

interface IDropdownItemFilter {
	currentDepartment: IDepartment;
	value: IDepartment;
	onPress: (value: IDepartment) => void;
}

const DropdownItemFilter = ({ currentDepartment, value, onPress }: IDropdownItemFilter): JSX.Element => (
	<DropdownItem
		text={value?.name}
		iconName={currentDepartment?._id === value?._id ? 'check' : null}
		onPress={() => onPress(value)}
	/>
);

export default DropdownItemFilter;
