/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { StyleSheet } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import Avatar from '../../app/containers/Avatar/Avatar';
import Status from '../../app/containers/Status/Status';
import sharedStyles from '../../app/views/Styles';

const styles = StyleSheet.create({
	custom: {
		padding: 16
	}
});

const server = 'https://open.rocket.chat';

const _theme = 'light';

const stories = storiesOf('Avatar', module);

stories.add('Avatar by text', () => (
	<Avatar
		text='Avatar'
		server={server}
		size={56}
	/>
));

stories.add('Avatar by roomId', () => (
	<Avatar
		type='p'
		rid='devWBbYr7inwupPqK'
		server={server}
		size={56}
	/>
));

stories.add('Avatar by url', () => (
	<Avatar
		avatar='https://user-images.githubusercontent.com/29778115/89444446-14738480-d728-11ea-9412-75fd978d95fb.jpg'
		server={server}
		size={56}
	/>
));

stories.add('Avatar by path', () => (
	<Avatar
		avatar='/avatar/diego.mello'
		server={server}
		size={56}
	/>
));

stories.add('With ETag', () => (
	<Avatar
		type='d'
		text='djorkaeff.alexandre'
		avatarETag='5ag8KffJcZj9m5rCv'
		server={server}
		size={56}
	/>
));

stories.add('Without ETag', () => (
	<Avatar
		type='d'
		text='djorkaeff.alexandre'
		server={server}
		size={56}
	/>
));

stories.add('Emoji', () => (
	<Avatar
		emoji='troll'
		getCustomEmoji={() => ({ name: 'troll', extension: 'jpg' })}
		server={server}
		size={56}
	/>
));

stories.add('Direct', () => (
	<Avatar
		text='diego.mello'
		server={server}
		type='d'
		size={56}
	/>
));

stories.add('Channel', () => (
	<Avatar
		text='general'
		server={server}
		type='c'
		size={56}
	/>
));

stories.add('Touchable', () => (
	<Avatar
		text='Avatar'
		server={server}
		onPress={() => console.log('Pressed!')}
		size={56}
	/>
));

stories.add('Static', () => (
	<Avatar
		avatar='https://user-images.githubusercontent.com/29778115/89444446-14738480-d728-11ea-9412-75fd978d95fb.jpg'
		server={server}
		isStatic
		size={56}
	/>
));

stories.add('Avatar by roomId', () => (
	<Avatar
		type='p'
		rid='devWBbYr7inwupPqK'
		server={server}
		size={56}
	/>
));

stories.add('Custom borderRadius', () => (
	<Avatar
		text='Avatar'
		server={server}
		borderRadius={28}
		size={56}
	/>
));

stories.add('Children', () => (
	<Avatar
		text='Avatar'
		server={server}
		size={56}
	>
		<Status
			size={24}
			style={[sharedStyles.status, styles.status]}
			theme={_theme}
		/>
	</Avatar>
));

stories.add('Wrong server', () => (
	<Avatar
		text='Avatar'
		server='https://google.com'
		size={56}
	/>
));

stories.add('Custom style', () => (
	<Avatar
		text='Avatar'
		server={server}
		size={56}
		style={styles.custom}
	/>
));
