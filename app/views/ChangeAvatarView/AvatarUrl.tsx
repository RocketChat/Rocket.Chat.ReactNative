import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import I18n from '../../i18n';
import { ControlledFormTextInput } from '../../containers/TextInput';

interface ISubmit {
	avatarUrl: string;
}

const AvatarUrl = ({ submit }: { submit: (value: string) => void }) => {
	const {
		control,
		formState: { isDirty },
		getValues
	} = useForm<ISubmit>({ mode: 'onChange', defaultValues: { avatarUrl: '' } });

	useEffect(() => {
		if (isDirty) {
			const { avatarUrl } = getValues();
			submit(avatarUrl);
		} else {
			submit('');
		}
	}, [isDirty]);

	return (
		<ControlledFormTextInput
			control={control}
			name='avatarUrl'
			label={I18n.t('Avatar_Url')}
			placeholder={I18n.t('insert_Avatar_URL')}
			testID='change-avatar-view-avatar-url'
			containerStyle={{ marginBottom: 0 }}
		/>
	);
};

export default AvatarUrl;
