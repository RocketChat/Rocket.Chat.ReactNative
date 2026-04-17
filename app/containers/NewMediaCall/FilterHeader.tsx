import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { FormTextInput } from '../TextInput';
import sharedStyles from '../../views/Styles';
import { textInputDebounceTime } from '../../lib/constants/debounceConfig';
import { useDebounce } from '../../lib/methods/helpers';
import type { IApplicationState } from '../../definitions';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';

export const FilterHeader = (): React.ReactElement => {
	const { colors } = useTheme();

	const filter = usePeerAutocompleteStore(state => state.filter);

	const username = useSelector((state: IApplicationState) => state.login.user?.username);
	const sipEnabled = useSelector((state: IApplicationState) =>
		Boolean(state.settings.VoIP_TeamCollab_SIP_Integration_For_Internal_Calls)
	);

	const debouncedFetchOptions = useDebounce(
		useCallback(
			(value: string) => {
				usePeerAutocompleteStore.getState().fetchOptions(value, { username, sipEnabled });
			},
			[username, sipEnabled]
		),
		textInputDebounceTime
	);

	const handleChangeText = (value: string) => {
		usePeerAutocompleteStore.setState({ filter: value, selectedPeer: null });
		debouncedFetchOptions(value);
	};

	return (
		<>
			<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('New_call')}</Text>

			<View style={styles.searchContainer}>
				<FormTextInput
					containerStyle={styles.searchInputContainer}
					iconRight='search'
					showErrorMessage={false}
					testID='new-media-call-search-input'
					onChangeText={handleChangeText}
					value={filter}
				/>
			</View>
			<Text style={[styles.inputLabel, { color: colors.fontDefault }]}>{I18n.t('Enter_username_or_number')}</Text>
		</>
	);
};

const styles = StyleSheet.create({
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
