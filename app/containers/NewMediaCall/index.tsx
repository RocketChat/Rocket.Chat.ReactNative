import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import { FormTextInput } from '../TextInput';
import Avatar from '../Avatar';
import { CustomIcon } from '../CustomIcon';
import Status from '../Status';
import sharedStyles from '../../views/Styles';
import { textInputDebounceTime } from '../../lib/constants/debounceConfig';
import { useDebounce } from '../../lib/methods/helpers';
import { usePeerAutocompleteStore } from '../../lib/services/voip/usePeerAutocompleteStore';
import type { TPeerInfo, TPeerItem } from '../../lib/services/voip/getPeerAutocompleteOptions';
import { mediaSessionInstance } from '../../lib/services/voip/MediaSessionInstance';
import { hideActionSheetRef } from '../ActionSheet';
import { PeerList } from './PeerList';
import { SelectedPeer } from './SelectedPeer';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16
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
	},

	callButton: {
		height: 52,
		marginTop: 32,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 4
	},
	callText: {
		fontSize: 16,
		lineHeight: 24,
		...sharedStyles.textMedium
	}
});

export const NewMediaCall = (): React.ReactElement => {
	const { colors } = useTheme();
	const [searchText, setSearchText] = useState('');

	const options = usePeerAutocompleteStore(state => state.options);
	const selectedPeer = usePeerAutocompleteStore(state => state.selectedPeer);
	const fetchOptions = usePeerAutocompleteStore(state => state.fetchOptions);
	const setSelectedPeer = usePeerAutocompleteStore(state => state.setSelectedPeer);
	const setFilter = usePeerAutocompleteStore(state => state.setFilter);
	const clearSelection = usePeerAutocompleteStore(state => state.clearSelection);

	const debouncedFetchOptions = useDebounce((value: string) => {
		fetchOptions(value);
	}, textInputDebounceTime);

	const handleChangeText = (value: string) => {
		setSearchText(value);
		setFilter(value);
		clearSelection();
		debouncedFetchOptions(value);
	};

	const handleSelectOption = (option: TPeerItem) => {
		const peerInfo: TPeerInfo =
			option.type === 'sip'
				? { number: option.label }
				: {
						userId: option.value,
						displayName: option.label,
						username: option.username,
						callerId: option.callerId,
						status: option.status
				  };

		setSelectedPeer(peerInfo);
		setSearchText('');
		setFilter('');
		fetchOptions('');
	};

	const selectedLabel = useMemo(() => {
		if (!selectedPeer) {
			return '';
		}

		return 'number' in selectedPeer ? selectedPeer.number : selectedPeer.displayName;
	}, [selectedPeer]);

	const handleCall = () => {
		if (!selectedPeer) {
			return;
		}

		if ('number' in selectedPeer) {
			mediaSessionInstance.startCall(selectedPeer.number, 'sip');
		} else {
			mediaSessionInstance.startCall(selectedPeer.userId, 'user');
		}

		hideActionSheetRef();
	};

	const isCallDisabled = !selectedPeer;
	const shouldShowOptions = !selectedPeer && searchText.trim().length > 0 && options.length > 0;

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
					value={searchText}
					onChangeText={handleChangeText}
				/>
			</View>
			<Text style={[styles.inputLabel, { color: colors.fontDefault }]}>{I18n.t('Enter_username_or_number')}</Text>

			<SelectedPeer selectedPeer={selectedPeer} selectedLabel={selectedLabel} clearSelection={clearSelection} />
			<PeerList shouldShowOptions={shouldShowOptions} options={options} onSelectOption={handleSelectOption} />

			<Pressable
				style={[
					styles.callButton,
					{
						backgroundColor: isCallDisabled ? colors.buttonBackgroundSuccessDisabled : colors.buttonBackgroundSuccessDefault
					}
				]}
				disabled={isCallDisabled}
				onPress={handleCall}
				accessibilityRole='button'
				accessibilityLabel={I18n.t('Call')}
				testID='new-media-call-button'
				android_ripple={{ color: colors.buttonBackgroundSuccessPress }}>
				<CustomIcon name='phone' size={24} color={isCallDisabled ? colors.buttonPrimaryDisabled : colors.fontWhite} />
				<Text style={[styles.callText, { color: isCallDisabled ? colors.buttonPrimaryDisabled : colors.fontWhite }]}>
					{I18n.t('Call')}
				</Text>
			</Pressable>
		</View>
	);
};

export default NewMediaCall;
