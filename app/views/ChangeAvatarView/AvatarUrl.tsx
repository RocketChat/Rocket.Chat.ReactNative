import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import I18n from '../../i18n';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { regExpImageType } from '../../lib/methods/helpers';

const schema = yup.object().shape({
	avatarUrl: yup.string().url().matches(regExpImageType).required()
});

interface ISubmit {
	avatarUrl: string;
}

const AvatarUrl = ({ submit }: { submit: (value: string) => void }) => {
	const {
		control,
		formState: { isValid },
		getValues
	} = useForm<ISubmit>({ mode: 'onChange', resolver: yupResolver(schema) });

	useEffect(() => {
		if (isValid) {
			const { avatarUrl } = getValues();
			submit(avatarUrl);
		} else {
			submit('');
		}
	}, [isValid]);

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
