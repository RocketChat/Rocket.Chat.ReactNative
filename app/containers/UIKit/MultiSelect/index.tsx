import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import Button from '../../Button';
import { useTheme } from '../../../theme';
import { IText } from '../interfaces';
import Chips from './Chips';
import Input from './Input';
import styles from './styles';
import { useActionSheet } from '../../ActionSheet';
import { MultiSelectContent } from './MultiSelectContent';

export interface IItemData {
	value: any;
	text: { text: string };
	imageUrl?: string;
}

interface IMultiSelectWithMultiSelect extends IMultiSelect {
	multiselect: true;
	onChange: ({ value }: { value: string[] }) => void;
}

interface IMultiSelectWithoutMultiSelect extends IMultiSelect {
	multiselect?: false;
	onChange: ({ value }: { value: any }) => void;
}

interface IMultiSelect {
	options?: IItemData[];
	placeholder?: IText;
	context?: BlockContext;
	loading?: boolean;
	onSearch?: (keyword: string) => IItemData[] | Promise<IItemData[] | undefined>;
	onClose?: () => void;
	inputStyle?: TextStyle;
	value?: any[];
	disabled?: boolean;
	innerInputStyle?: object;
}

export const MultiSelect = React.memo(
	({
		options = [],
		onChange,
		placeholder = { text: 'Search' },
		context,
		loading,
		value: values,
		multiselect = false,
		onSearch,
		onClose = () => {},
		disabled,
		inputStyle,
		innerInputStyle
	}: IMultiSelectWithMultiSelect | IMultiSelectWithoutMultiSelect) => {
		const { colors } = useTheme();
		const [selected, select] = useState<IItemData[]>(Array.isArray(values) ? values : []);
		const [currentValue, setCurrentValue] = useState('');

		const { showActionSheet, hideActionSheet } = useActionSheet();

		useEffect(() => {
			if (Array.isArray(values)) {
				select(values);
			}
		}, []);

		useEffect(() => {
			if (values && values.length && !multiselect) {
				setCurrentValue(values[0].text);
			}
		}, []);

		const onShow = () => {
			showActionSheet({
				children: (
					<MultiSelectContent
						options={options}
						onSearch={onSearch}
						select={select}
						onChange={onChange}
						setCurrentValue={setCurrentValue}
						onHide={onHide}
						multiselect={multiselect}
						selectedItems={selected}
					/>
				),
				onClose
			});
		};
		const onHide = () => {
			onClose();
			hideActionSheet();
		};

		const onSelect = (item: IItemData) => {
			const {
				value,
				text: { text }
			} = item;
			if (multiselect) {
				let newSelect = [];
				if (!selected.find(s => s.value === value)) {
					newSelect = [...selected, item];
				} else {
					newSelect = selected.filter((s: any) => s.value !== value);
				}
				select(newSelect);
				onChange({ value: newSelect.map(s => s.value) });
			} else {
				onChange({ value });
				setCurrentValue(text);
			}
		};

		let button = multiselect ? (
			<Button title={`${selected.length} selecteds`} onPress={onShow} loading={loading} />
		) : (
			<Input onPress={onShow} loading={loading} disabled={disabled} inputStyle={inputStyle} innerInputStyle={innerInputStyle}>
				<Text style={[styles.pickerText, { color: currentValue ? colors.fontTitlesLabels : colors.fontSecondaryInfo }]}>
					{currentValue || placeholder.text}
				</Text>
			</Input>
		);

		if (context === BlockContext.FORM) {
			button = (
				<Input onPress={onShow} loading={loading} disabled={disabled} inputStyle={inputStyle} innerInputStyle={innerInputStyle}>
					{selected.length ? (
						<Chips items={selected} onSelect={(item: any) => (disabled ? {} : onSelect(item))} />
					) : (
						<Text style={[styles.pickerText, { color: colors.fontSecondaryInfo }]}>{placeholder.text}</Text>
					)}
				</Input>
			);
		}

		return <>{button}</>;
	}
);
