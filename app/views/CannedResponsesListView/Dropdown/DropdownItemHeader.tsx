import React from 'react';

import { IDepartment } from '../../../definitions/ICannedResponse';
import DropdownItem from './DropdownItem';

interface IDropdownItemHeader {
	department: IDepartment;
	onPress: () => void;
}

const DropdownItemHeader = ({ department, onPress }: IDropdownItemHeader): JSX.Element => (
	<DropdownItem text={department?.name} iconName='filter' onPress={onPress} />
);

export default DropdownItemHeader;
