import React from 'react';

import I18n from '../../i18n';
import { FormTextInput } from '../../containers/TextInput';
import { useDebounce, isImageURL } from '../../lib/methods/helpers';

const AvatarUrl = ({ submit }: { submit: (value: string) => void }) => {
	const handleChangeText = useDebounce(async (value: string) => {
		if (value) {
			const result = await isImageURL(value);
			if (result) {
				return submit(value);
			}
			return submit('');
		}
	}, 500);

	return (
		<FormTextInput
			label={I18n.t('Avatar_Url')}
			placeholder={I18n.t('insert_Avatar_URL')}
			onChangeText={handleChangeText}
			testID='change-avatar-view-avatar-url'
			containerStyle={{ marginBottom: 0 }}
		/>
	);
};

export default AvatarUrl;
