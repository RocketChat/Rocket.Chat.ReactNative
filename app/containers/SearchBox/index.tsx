import React, { useCallback, useState } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';

import I18n from '../../i18n';
import { FormTextInput } from '../TextInput';
import { getChannelsByUser, getUnreadMessagesByUser, getUserInfoAndRooms } from '../../lib/services/restApi';

const styles = StyleSheet.create({
	inputContainer: {
		margin: 16,
		marginBottom: 16
	}
});

const SearchBox = ({ onChangeText, onSubmitEditing, testID }: TextInputProps): JSX.Element => {
	const [text, setText] = useState('');

	const internalOnChangeText = useCallback(value => {
		setText(value);
		onChangeText?.(value);
	}, []);

	return (
		<View testID='searchbox'>
			<FormTextInput
				autoCapitalize='none'
				autoCorrect={false}
				blurOnSubmit
				placeholder={I18n.t('Search')}
				returnKeyType='search'
				underlineColorAndroid='transparent'
				containerStyle={styles.inputContainer}
				onChangeText={internalOnChangeText}
				onSubmitEditing={onSubmitEditing}
				value={text}
				testID={testID}
				onClearInput={() => {
					internalOnChangeText('');
					console.count('onClearInput');
					getUserInfoAndRooms()
						.then(data => console.log(JSON.stringify(data)))
						.catch(err => console.log(`error: ${JSON.stringify(err)}`));
				}}
				iconRight={'search'}
			/>
		</View>
	);
};

export default SearchBox;
