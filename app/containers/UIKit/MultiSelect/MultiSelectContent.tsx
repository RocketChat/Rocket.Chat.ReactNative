import React, { useState } from 'react';
import { View } from 'react-native';

import { FormTextInput } from '../../TextInput/FormTextInput';
import { textParser } from '../utils';
import I18n from '../../../i18n';
import Items from './Items';
import styles from './styles';
import { useTheme } from '../../../theme';
import { IItemData } from '.';
import { debounce } from '../../../lib/methods/helpers/debounce';
import { isIOS } from '../../../lib/methods/helpers';
import { useActionSheet } from '../../ActionSheet';

interface IMultiSelectContentProps {
	onSearch?: (keyword: string) => IItemData[] | Promise<IItemData[] | undefined>;
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
		const { colors } = useTheme();
		const [selected, setSelected] = useState<string[]>(Array.isArray(selectedItems) ? selectedItems : []);
		const [items, setItems] = useState<IItemData[] | undefined>(options);
		const { hideActionSheet } = useActionSheet();

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
				onChange({ value: newSelect });
			} else {
				onChange({ value });
				setCurrentValue(text);
				onHide();
			}
		};

		const handleSearch = debounce(
			async (text: string) => {
				if (onSearch) {
					const res = await onSearch(text);
					setItems(res);
				} else {
					setItems(options?.filter((option: any) => textParser([option.text]).toLowerCase().includes(text.toLowerCase())));
				}
			},
			onSearch ? 300 : 0
		);

		return (
			<View style={[styles.actionSheetContainer]}>
				<FormTextInput
					testID='multi-select-search'
					onChangeText={handleSearch}
					placeholder={I18n.t('Search')}
					inputStyle={{ backgroundColor: colors.focusedBackground }}
					bottomSheet={isIOS}
					onSubmitEditing={() => {
						setTimeout(() => {
							hideActionSheet();
						}, 150);
					}}
				/>
				<Items items={items || []} selected={selected} onSelect={onSelect} />
			</View>
		);
	}
);
