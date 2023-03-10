import React from 'react';

import { ILivechatDepartment } from '../../../definitions/ILivechatDepartment';
import DropdownItem from './DropdownItem';

interface IDropdownItemFilter {
	currentDepartment: ILivechatDepartment;
	value: ILivechatDepartment;
	onPress: (value: ILivechatDepartment) => void;
}

const DropdownItemFilter = ({ currentDepartment, value, onPress }: IDropdownItemFilter): JSX.Element => (
	<DropdownItem
		text={value?.name}
		iconName={currentDepartment?._id === value?._id ? 'check' : null}
		onPress={() => onPress(value)}
	/>
);

export default DropdownItemFilter;
