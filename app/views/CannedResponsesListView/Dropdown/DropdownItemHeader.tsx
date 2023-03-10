import React from 'react';

import { ILivechatDepartment } from '../../../definitions/ILivechatDepartment';
import DropdownItem from './DropdownItem';

interface IDropdownItemHeader {
	department: ILivechatDepartment;
	onPress: () => void;
}

const DropdownItemHeader = ({ department, onPress }: IDropdownItemHeader): React.ReactElement => (
	<DropdownItem text={department?.name} iconName='filter' onPress={onPress} />
);

export default DropdownItemHeader;
