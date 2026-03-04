import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { FormTextInput } from '../TextInput';
import sharedStyles from '../../views/Styles';
import { textInputDebounceTime } from '../../lib/constants/debounceConfig';
import { useDebounce } from '../../lib/methods/helpers';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const Container = ({ children }: { children: React.ReactElement[] }) => {
	const { colors } = useTheme();

	const filter = usePeerAutocompleteStore(state => state.filter);
	const setFilter = usePeerAutocompleteStore(state => state.setFilter);
	const fetchOptions = usePeerAutocompleteStore(state => state.fetchOptions);
	const clearSelection = usePeerAutocompleteStore(state => state.clearSelection);

	const debouncedFetchOptions = useDebounce((value: string) => {
		fetchOptions(value);
	}, textInputDebounceTime);

	const handleChangeText = (value: string) => {
		setFilter(value);
		clearSelection();
		debouncedFetchOptions(value);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('New_call')}</Text>

			<View style={styles.searchContainer}>
				<FormTextInput
					containerStyle={styles.searchInputContainer}
					iconRight='search'
					bottomSheet
					showErrorMessage={false}
					testID='new-media-call-search-input'
					onChangeText={handleChangeText}
					value={filter}
				/>
			</View>
			<Text style={[styles.inputLabel, { color: colors.fontDefault }]}>{I18n.t('Enter_username_or_number')}</Text>

			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 16
	},
	title: {
		fontSize: 20,
		lineHeight: 28,
		marginTop: 4,
		...sharedStyles.textBold
	},
	searchContainer: {
		marginTop: 28,
		marginBottom: 8
	},
	searchInputContainer: {
		marginBottom: 0
	},
	inputLabel: {
		fontSize: 16,
		lineHeight: 24,
		marginBottom: 16,
		...sharedStyles.textRegular
	}
});
