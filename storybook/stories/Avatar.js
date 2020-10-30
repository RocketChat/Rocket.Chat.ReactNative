import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { themes } from '../../app/constants/colors';
import Avatar from '../../app/containers/Avatar/Avatar';
import Status from '../../app/containers/Status/Status';
import StoriesSeparator from './StoriesSeparator';
import sharedStyles from '../../app/views/Styles';

const styles = StyleSheet.create({
	status: {
		borderWidth: 4,
		bottom: -4,
		right: -4
	},
	custom: {
		padding: 16
	}
});

const server = 'https://open.rocket.chat';

const Separator = ({ title, theme }) => <StoriesSeparator title={title} theme={theme} />;
Separator.propTypes = {
	title: PropTypes.string,
	theme: PropTypes.string
};

const AvatarStories = ({ theme }) => (
	<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>
		<Separator title='Avatar by text' theme={theme} />
		<Avatar
			text='Avatar'
			server={server}
			size={56}
		/>
		<Separator title='Avatar by roomId' theme={theme} />
		<Avatar
			type='p'
			rid='devWBbYr7inwupPqK'
			server={server}
			size={56}
		/>
		<Separator title='Avatar by url' theme={theme} />
		<Avatar
			avatar='https://user-images.githubusercontent.com/29778115/89444446-14738480-d728-11ea-9412-75fd978d95fb.jpg'
			server={server}
			size={56}
		/>
		<Separator title='Avatar by path' theme={theme} />
		<Avatar
			avatar='/avatar/diego.mello'
			server={server}
			size={56}
		/>
		<Separator title='With ETag' theme={theme} />
		<Avatar
			type='d'
			text='djorkaeff.alexandre'
			avatarETag='5ag8KffJcZj9m5rCv'
			server={server}
			size={56}
		/>
		<Separator title='Without ETag' theme={theme} />
		<Avatar
			type='d'
			text='djorkaeff.alexandre'
			server={server}
			size={56}
		/>
		<Separator title='Emoji' theme={theme} />
		<Avatar
			emoji='troll'
			getCustomEmoji={() => ({ name: 'troll', extension: 'jpg' })}
			server={server}
			size={56}
		/>
		<Separator title='Direct' theme={theme} />
		<Avatar
			text='diego.mello'
			server={server}
			type='d'
			size={56}
		/>
		<Separator title='Channel' theme={theme} />
		<Avatar
			text='general'
			server={server}
			type='c'
			size={56}
		/>
		<Separator title='Touchable' theme={theme} />
		<Avatar
			text='Avatar'
			server={server}
			onPress={() => console.log('Pressed!')}
			size={56}
		/>
		<Separator title='Static' theme={theme} />
		<Avatar
			avatar='https://user-images.githubusercontent.com/29778115/89444446-14738480-d728-11ea-9412-75fd978d95fb.jpg'
			server={server}
			isStatic
			size={56}
		/>
		<Separator title='Custom borderRadius' theme={theme} />
		<Avatar
			text='Avatar'
			server={server}
			borderRadius={28}
			size={56}
		/>
		<Separator title='Children' theme={theme} />
		<Avatar
			text='Avatar'
			server={server}
			size={56}
		>
			<Status
				size={24}
				style={[sharedStyles.status, styles.status]}
				theme={theme}
			/>
		</Avatar>
		<Separator title='Wrong server' theme={theme} />
		<Avatar
			text='Avatar'
			server='https://google.com'
			size={56}
		/>
		<Separator title='Custom style' theme={theme} />
		<Avatar
			text='Avatar'
			server={server}
			size={56}
			style={styles.custom}
		/>
	</ScrollView>
);
AvatarStories.propTypes = {
	theme: PropTypes.string
};
export default AvatarStories;
