import React from 'react';
import { StyleSheet } from 'react-native';

import Status from '../Status/Status';
import sharedStyles from '../../views/Styles';
import Avatar from './Avatar';

const styles = StyleSheet.create({
	custom: {
		padding: 16
	}
});

const server = 'https://open.rocket.chat';

export default {
	title: 'Avatar'
};

export const AvatarText = () => <Avatar text='Avatar' server={server} size={56} />;

export const AvatarRoomId = () => <Avatar type='p' rid='devWBbYr7inwupPqK' server={server} size={56} />;

export const AvatarUrl = () => (
	<Avatar
		avatar='https://user-images.githubusercontent.com/29778115/89444446-14738480-d728-11ea-9412-75fd978d95fb.jpg'
		server={server}
		size={56}
	/>
);

export const AvatarPath = () => <Avatar avatar='/avatar/diego.mello' server={server} size={56} />;

export const WithETag = () => (
	<Avatar type='d' text='djorkaeff.alexandre' avatarETag='5ag8KffJcZj9m5rCv' server={server} size={56} />
);

export const WithoutETag = () => <Avatar type='d' text='djorkaeff.alexandre' server={server} size={56} />;

export const Emoji = () => (
	<Avatar emoji='troll' getCustomEmoji={() => ({ name: 'troll', extension: 'jpg' })} server={server} size={56} />
);

export const Direct = () => <Avatar text='diego.mello' server={server} type='d' size={56} />;

export const Channel = () => <Avatar text='general' server={server} type='c' size={56} />;

export const Touchable = () => <Avatar text='Avatar' server={server} onPress={() => console.log('Pressed!')} size={56} />;

export const Static = () => (
	<Avatar
		avatar='https://user-images.githubusercontent.com/29778115/89444446-14738480-d728-11ea-9412-75fd978d95fb.jpg'
		server={server}
		isStatic
		size={56}
	/>
);

export const CustomBorderRadius = () => <Avatar text='Avatar' server={server} borderRadius={28} size={56} />;

export const Children = () => (
	<Avatar text='Avatar' server={server} size={56}>
		<Status size={24} style={[sharedStyles.status]} status='busy' />
	</Avatar>
);

export const WrongServer = () => <Avatar text='Avatar' server='https://google.com' size={56} />;

export const CustomStyle = () => <Avatar text='Avatar' server={server} size={56} style={styles.custom} />;

export const AvatarExternalProviderUrl = () => (
	<Avatar
		text='Avatar'
		server={server}
		size={56}
		avatarExternalProviderUrl={
			'https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=0.752xw:1.00xh;0.175xw,0&resize=1200:*'
		}
	/>
);

export const RoomAvatarExternalProviderUrl = () => (
	<Avatar
		server={server}
		size={56}
		roomAvatarExternalProviderUrl={'https://cdn.pensador.com/img/authors/ho/me/homer-simpson-l.jpg'}
		// obligatory pass type, serverVersion and rid
		type='c'
		serverVersion={'3.8.0'}
		rid='devWBbYr7inwupPqK'
	/>
);
