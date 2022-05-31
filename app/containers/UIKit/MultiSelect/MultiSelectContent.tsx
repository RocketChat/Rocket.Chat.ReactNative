import React, { useState } from 'react';
import { View } from 'react-native';

import FormTextInput from '../../TextInput/FormTextInput';
import { textParser } from '../utils';
import I18n from '../../../i18n';
import Items from './Items';
import styles from './styles';
import { useTheme } from '../../../theme';
import { IItemData } from '.';

interface IMultiSelectContentProps {
	onSearch?: () => void;
	options?: IItemData[];
	multiselect: boolean;
	select: React.Dispatch<any>;
	onChange: Function;
	setCurrentValue: React.Dispatch<React.SetStateAction<string>>;
	onHide: Function;
	selectedItems: string[];
}

export const MultiSelectContent = React.memo(
	({ onSearch, options, multiselect, select, onChange, setCurrentValue, onHide, selectedItems }: IMultiSelectContentProps) => {
		const { theme, colors } = useTheme();
		const [selected, setSelected] = useState<string[]>(Array.isArray(selectedItems) ? selectedItems : []);
		const [search, onSearchChange] = useState('');

		const onSelect = (item: IItemData) => {
			const {
				value,
				text: { text }
			} = item;
			if (multiselect) {
				let newSelect = [];
				if (!selected.includes(value)) {
					newSelect = [...selected, value];
				} else {
					newSelect = selected.filter((s: any) => s !== value);
				}
				setSelected(newSelect);
				select(newSelect);
			} else {
				onChange({ value });
				setCurrentValue(text);
				onHide();
			}
		};

		const items: IItemData[] | undefined = onSearch
			? options
			: options?.filter((option: any) => textParser([option.text]).toLowerCase().includes(search.toLowerCase()));

		return (
			<View style={[styles.actionSheetContainer]}>
				<FormTextInput
					testID='multi-select-search'
					onChangeText={onSearch || onSearchChange}
					placeholder={I18n.t('Search')}
					theme={theme}
					inputStyle={{ backgroundColor: colors.focusedBackground }}
				/>
				<Items items={items || []} selected={selected} onSelect={onSelect} theme={theme} />
			</View>
		);
	}
);
