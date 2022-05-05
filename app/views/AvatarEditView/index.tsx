import React, { useLayoutEffect, useState } from 'react';
// import { useSelector } from 'react-redux';

import { ProfileStackParamList } from '../../stacks/types';
import { IBaseScreen } from '../../definitions';
import SafeAreaView from '../../containers/SafeAreaView';
import Button from '../../containers/Button';
import { useTheme } from '../../theme';
import i18n from '../../i18n';
import RCTextInput from '../../containers/TextInput';
// import { getUserSelector } from '../../selectors/login';
// import Avatar from '../../containers/Avatar';

const AvatarEditView = ({ navigation }: IBaseScreen<ProfileStackParamList, 'AvatarEditView'>): React.ReactElement => {
	const [avatarUrl, setAvatarUrl] = useState('');
	const [saving] = useState(false);

	// const username = useSelector((state: IApplicationState) => getUserSelector(state).username);
	// const url = useSelector((state: IApplicationState) => getUserSelector(state).username);

	const { theme } = useTheme();

	useLayoutEffect(() => {
		navigation.setOptions({
			title: 'Avatar'
		});
	}, []);
	return (
		<SafeAreaView>
			{/* <Avatar text={username} avatar={avatar?.url} isStatic={avatar?.url} size={120} /> */}
			<RCTextInput
				label={i18n.t('Avatar_Url')}
				placeholder={i18n.t('Avatar_Url_Insert_Image')}
				value={avatarUrl}
				onChangeText={value => setAvatarUrl(value)}
				// onSubmitEditing={this.submit}
				testID='profile-view-avatar-url'
				theme={theme}
			/>
			<Button
				title={i18n.t('Save_Changes')}
				type='primary'
				// onPress={this.submit}
				// disabled={!this.formIsChanged()}
				testID='profile-view-submit'
				loading={saving}
				theme={theme}
			/>
		</SafeAreaView>
	);
};

export default AvatarEditView;
