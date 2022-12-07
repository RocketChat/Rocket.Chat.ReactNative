import React from 'react';

import I18n from '../../i18n';
import { FormTextInput } from '../../containers/TextInput';
import { useDebounce, isImage, isValidURLRequest, isValidURL } from '../../lib/methods/helpers';

const AvatarUrl = ({ submit }: { submit: (value: string) => void }) => {
	const handleChangeText = useDebounce(async (value: string) => {
		if (isImage(value) && isValidURL(value)) {
			const result = await isValidURLRequest(value);
			if (result) {
				submit(value);
			}
		}
	}, 300);

	return (
		<FormTextInput
			label={I18n.t('Avatar_Url')}
			placeholder={I18n.t('Avatar_Url')}
			onChangeText={handleChangeText}
			testID='change-avatar-view-avatar-url'
			containerStyle={{ marginBottom: 0 }}
		/>
	);
};

export default AvatarUrl;
