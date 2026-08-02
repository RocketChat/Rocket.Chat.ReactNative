import { Dimensions, View } from 'react-native';

import { longText } from '../../../.rnstorybook/utils';
import { ThemeContext, type TSupportedThemes } from '../../theme';
import { colors, themes } from '../../lib/constants/colors';
import RoomHeaderComponent from './RoomHeader';

const { width, height } = Dimensions.get('window');

export default {
	title: 'RoomHeader'
};

const HeaderExample = ({ title, theme = 'light' }: { title: Function; theme?: TSupportedThemes }) => (
	// Using View directly instead of Header from react-navigation because it's easier to test.
	<View style={{ flex: 1, maxHeight: 48, backgroundColor: themes[theme].surfaceNeutral }}>{title()}</View>
);

const RoomHeader = ({ ...props }) => (
	<RoomHeaderComponent
		width={width}
		height={height}
		title='title'
		type='p'
		testID={props.title}
		onPress={() => alert('header pressed!')}
		status={props.status}
		usersTyping={props.usersTyping}
		{...props}
	/>
);

export const TitleSubtitle = () => (
	<>
		<HeaderExample title={() => <RoomHeader title='title' type='p' />} />
		<HeaderExample title={() => <RoomHeader title={longText} type='p' />} />
		<HeaderExample title={() => <RoomHeader subtitle='subtitle' />} />
		<HeaderExample title={() => <RoomHeader subtitle={longText} />} />
		<HeaderExample title={() => <RoomHeader title={longText} subtitle={longText} />} />
	</>
);

export const Icons = () => (
	<>
		<HeaderExample title={() => <RoomHeader title='private channel' type='p' />} />
		<HeaderExample title={() => <RoomHeader title='public channel' type='c' />} />
		<HeaderExample title={() => <RoomHeader title='discussion' prid='asd' />} />
		<HeaderExample title={() => <RoomHeader title='omnichannel' type='l' />} />
		<HeaderExample title={() => <RoomHeader title='private team' type='p' teamMain />} />
		<HeaderExample title={() => <RoomHeader title='public team' type='c' teamMain />} />
		<HeaderExample title={() => <RoomHeader title='group dm' type='d' isGroupChat />} />
		<HeaderExample title={() => <RoomHeader title='online dm' type='d' status='online' />} />
		<HeaderExample title={() => <RoomHeader title='away dm' type='d' status='away' />} />
		<HeaderExample title={() => <RoomHeader title='busy dm' type='d' status='busy' />} />
		<HeaderExample title={() => <RoomHeader title='loading dm' type='d' status='loading' />} />
		<HeaderExample title={() => <RoomHeader title='offline dm' type='d' />} />
		<HeaderExample
			title={() => (
				<RoomHeader title='classified' type='p' abacAttributes={[{ key: 'Attribute', values: ['Value 1', 'Value 2'] }]} />
			)}
		/>
		<HeaderExample
			title={() => (
				<RoomHeader
					title='classified'
					type='p'
					abacAttributes={[{ key: 'Attribute', values: ['Value 1', 'Value 2'] }]}
					teamMain
				/>
			)}
		/>
	</>
);

export const Typing = () => (
	<>
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1']} />} />
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1', 'user 2']} />} />
		<HeaderExample title={() => <RoomHeader usersTyping={['user 1', 'user 2', 'user 3', 'user 4', 'user 5']} />} />
	</>
);

export const Thread = () => (
	<>
		<HeaderExample title={() => <RoomHeader tmid='123' parentTitle='parent title' />} />
		<HeaderExample title={() => <RoomHeader tmid='123' title={'markdown\npreview\n#3\n4\n5'} parentTitle={longText} />} />
	</>
);

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
		<HeaderExample title={() => <RoomHeader subtitle='subtitle' />} theme={theme} />
	</ThemeContext.Provider>
);

export const Themes = () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
);

export const DM_Status = () => {
	const futureExpiry = '2030-06-15T19:00:00.000Z';
	const now = new Date().getTime();
	const hourLaterExpiry = new Date(now + 3600000).toISOString();
	const expiredExpiry = new Date(now - 3600000).toISOString();
	return (
		<>
			<HeaderExample
				title={() => <RoomHeader title='John Doe' type='d' roomUserId='user1' subtitle='Online' status='online' />}
			/>
			<HeaderExample title={() => <RoomHeader title='John Doe' type='d' roomUserId='user2' subtitle='Away' status='away' />} />
			<HeaderExample title={() => <RoomHeader title='John Doe' type='d' roomUserId='user3' subtitle='Busy' status='busy' />} />
			<HeaderExample
				title={() => <RoomHeader title='John Doe' type='d' roomUserId='user4' subtitle='Offline' status='offline' />}
			/>
			<HeaderExample
				title={() => <RoomHeader title='John Doe' type='d' roomUserId='user5' subtitle='In a meeting' status='online' />}
			/>
			<HeaderExample
				title={() => (
					<RoomHeader
						title='John Doe'
						type='d'
						roomUserId='user6'
						subtitle='In a meeting'
						status='online'
						statusExpiresAt={futureExpiry}
					/>
				)}
			/>
			<HeaderExample
				title={() => (
					<RoomHeader
						title='John Doe'
						type='d'
						roomUserId='user9'
						subtitle='having lunch (clock icon should be visible)'
						status='away'
						statusExpiresAt={hourLaterExpiry}
					/>
				)}
			/>
			<HeaderExample
				title={() => (
					<RoomHeader
						title='John Doe'
						type='d'
						roomUserId='user8'
						subtitle='In a meeting (past expiry — clock icon should be hidden)'
						status='online'
						statusExpiresAt={expiredExpiry}
					/>
				)}
			/>
		</>
	);
};
