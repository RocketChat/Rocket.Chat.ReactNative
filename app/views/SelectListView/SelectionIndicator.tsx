import * as List from '~/containers/List';
import { ICON_SIZE } from '~/containers/List/constants';
import Radio from '~/containers/Radio';
import { useTheme } from '~/theme';

interface ISelectionIndicator {
	name: string;
	isRadio?: boolean;
	isChecked: boolean;
}

const SelectionIndicator = ({ name, isRadio, isChecked }: ISelectionIndicator) => {
	const { colors } = useTheme();
	if (isRadio) {
		return (
			<Radio
				testID={isChecked ? `radio-button-selected-${name}` : `radio-button-unselected-${name}`}
				check={isChecked}
				size={ICON_SIZE}
			/>
		);
	}
	return isChecked ? <List.Icon testID={`${name}-checked`} name='check' color={colors.fontHint} /> : null;
};

export default SelectionIndicator;
