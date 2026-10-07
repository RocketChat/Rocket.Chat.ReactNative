import { type ReactElement } from 'react';

import { useTheme } from '~/theme';
import ListIcon from './ListIcon';
import { useIsNativeList } from '../native/context';
import NativeListToggle from '../native/components/Toggle';

export interface IListCheckbox {
	value: boolean;
	onValueChange: (value: boolean) => void;
	testID?: string;
}

const ListCheckbox = ({ value, onValueChange, testID }: IListCheckbox): ReactElement => {
	const { colors } = useTheme();
	const isNativeList = useIsNativeList();

	if (isNativeList) {
		return <NativeListToggle value={value} onValueChange={onValueChange} testID={testID} tintColor={colors.strokeHighlight} />;
	}

	return <ListIcon name={value ? 'checkbox-checked' : 'checkbox-unchecked'} color={value ? colors.strokeHighlight : ''} />;
};

ListCheckbox.displayName = 'List.Checkbox';

export default ListCheckbox;
