import { useEffect, useRef, useState, memo, type Dispatch, type SetStateAction } from 'react';
import { View } from 'react-native';

import { textInputDebounceTime } from '~/lib/constants/debounceConfig';
import { FormTextInput } from '~/containers/TextInput/FormTextInput';
import ActivityIndicator from '~/containers/ActivityIndicator';
import { textParser } from '../utils';
import I18n from '~/i18n';
import Items from './Items';
import styles from './styles';
import { useTheme } from '~/theme';
import { type IItemData } from '.';
import { debounce } from '~/lib/methods/helpers/debounce';
import { useActionSheet } from '~/containers/ActionSheet';

interface IMultiSelectContentProps {
	onSearch?: (keyword: string) => IItemData[] | Promise<IItemData[] | undefined>;
	options?: IItemData[];
	multiselect: boolean;
	select: Dispatch<any>;
	onChange: ({ value }: { value: string[] }) => void;
	setCurrentValue: Dispatch<SetStateAction<string>>;
	onHide: Function;
	selectedItems: IItemData[];
}

export const MultiSelectContent = memo(
	({ onSearch, options, multiselect, select, onChange, setCurrentValue, onHide, selectedItems }: IMultiSelectContentProps) => {
		const { colors } = useTheme();
		const [selected, setSelected] = useState<IItemData[]>(Array.isArray(selectedItems) ? selectedItems : []);
		const [items, setItems] = useState<IItemData[] | undefined>(options);
		const needsInitialSearch = (!options || options.length === 0) && !!onSearch;
		const [searching, setSearching] = useState(needsInitialSearch);
		const lastQuery = useRef('');
		const { hideActionSheet } = useActionSheet();

		useEffect(() => {
			if (needsInitialSearch) {
				let cancelled = false;
				Promise.resolve((onSearch as NonNullable<typeof onSearch>)('')).then(
					initialItems => {
						if (cancelled) {
							return;
						}
						setSearching(false);
						if (!lastQuery.current) {
							setItems(initialItems || []);
						}
					},
					() => {
						if (cancelled) {
							return;
						}
						setSearching(false);
						if (!lastQuery.current) {
							setItems([]);
						}
					}
				);
				return () => {
					cancelled = true;
				};
			}
		}, [needsInitialSearch, onSearch]);

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
				setSelected(newSelect);
				select(newSelect);
				onChange({ value: newSelect.map(s => s.value) });
			} else {
				onChange({ value });
				setCurrentValue(text);
				onHide();
			}
		};

		const handleSearch = debounce(
			async (text: string) => {
				if (onSearch) {
					lastQuery.current = text;
					const res = await Promise.resolve(onSearch(text)).catch(() => undefined);
					if (lastQuery.current === text) {
						setItems(res || []);
					}
				} else {
					setItems(options?.filter((option: any) => textParser([option.text]).toLowerCase().includes(text.toLowerCase())));
				}
			},
			onSearch ? textInputDebounceTime : 0
		);

		return (
			<View style={styles.actionSheetContainer}>
				<View style={styles.inputStyle}>
					<FormTextInput
						testID='multi-select-search'
						onChangeText={handleSearch}
						placeholder={I18n.t('Search')}
						inputStyle={{ backgroundColor: colors.surfaceLight }}
						onSubmitEditing={() => {
							setTimeout(() => {
								hideActionSheet();
							}, 150);
						}}
					/>
				</View>
				{searching && !items?.length ? (
					<View style={styles.loading}>
						<ActivityIndicator />
					</View>
				) : null}
				<Items items={items || []} selected={selected} onSelect={onSelect} />
			</View>
		);
	}
);
