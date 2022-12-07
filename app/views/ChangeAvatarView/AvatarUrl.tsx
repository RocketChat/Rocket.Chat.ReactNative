import React, { useState } from 'react';

import I18n from '../../i18n';
import { FormTextInput } from '../../containers/TextInput';

const AvatarUrl = ({ onSubmit }: { onSubmit: (value: string) => void }) => {
	const [avatarUrl, setAvatarUrl] = useState('');
	return (
		<FormTextInput
			label={I18n.t('Avatar_Url')}
			placeholder={I18n.t('Avatar_Url')}
			value={avatarUrl || undefined}
			onChangeText={setAvatarUrl}
			onSubmitEditing={() => onSubmit(avatarUrl)}
			testID='change-avatar-view-avatar-url'
			containerStyle={{ marginBottom: 0 }}
		/>
	);
};

export default AvatarUrl;
