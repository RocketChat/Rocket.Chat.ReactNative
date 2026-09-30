import { type ReactElement } from 'react';

import { useTheme } from '~/theme';
import ListIcon from './ListIcon';

export interface IListCheckbox {
	value: boolean;
	onValueChange: (value: boolean) => void;
	testID?: string;
}

const ListCheckbox = ({ value }: IListCheckbox): ReactElement => {
	const { colors } = useTheme();
	return <ListIcon name={value ? 'checkbox-checked' : 'checkbox-unchecked'} color={value ? colors.strokeHighlight : ''} />;
};

ListCheckbox.displayName = 'List.Checkbox';

export default ListCheckbox;
