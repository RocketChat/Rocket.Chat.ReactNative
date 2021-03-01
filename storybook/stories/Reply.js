/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { ScrollView, View } from "react-native";
import { storiesOf } from '@storybook/react-native';

import ReplyComponent from '../../app/containers/message/Reply';
import { ThemeContext } from '../../app/theme';
import MessageContext from '../../app/containers/message/Context';
import { themes } from '../../app/constants/colors';

const user = {
	id: '',
	username: 'gerzon.canario',
	token: ''
};

const baseUrl = "https://open.rocket.chat";

const stories = storiesOf('Reply', module);

const item = {
    ts: "1970-01-01T00:00:00.000Z",
	author_name: "John Doe",
	text: "This is a sample message",
    fields: [
      {
        title: "Attachment's title:",
        value: "Lorem ipsum dolor sit amet",
        short: true
      },
    ],
  };

const Reply = ({ theme, ...props }) => (
	<MessageContext.Provider
		value={{
			user,
			baseUrl,
		}}
	>
		<ThemeContext.Provider value={theme}>
			<ReplyComponent theme={theme || 'light'} attachment={item} timeFormat="LT" {...props} />
		</ThemeContext.Provider>
	</MessageContext.Provider>
);

stories.add('content', () => (
	<ScrollView style={{ margin: 16 }}>
		<Reply />
		<Reply attachment={{ ...item, color: 'green' }} />
		<Reply 
			attachment={{
							...item, 
							color: 'orange',
							fields:
								[
									{
										title: "Attachment's title:",
										value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce sit amet aliquet augue. Nulla malesuada enim ac magna pharetra viverra.",
										short: false
									}, 
								]
						}}
		/>
		<Reply attachment={{...item,  
								title: 'Name',
								fields: [
										{
											title: "Attachment's title:",
											value: "Lorem ipsum dolor sit amet",
											short: true
										},
										{
											title: "Attachment's title:",
											value: "Lorem ipsum dolor sit amet",
											short: true
										},
									],
							}} 
		/>
		<Reply />
	</ScrollView>
));

const backgroundColor = (theme) => (
	{
		backgroundColor: themes[theme].backgroundColor, 
		flex: 1,
		padding: 16
	}
);

stories.add('themes', () => (
	<View style={{ flex: 1 }}>
		<View style={backgroundColor('light')}>
			<Reply theme={'light'} />
		</View>
		<View style={backgroundColor('dark')}>
			<Reply theme={'dark'} />
		</View>
		<View style={backgroundColor('black')}>
			<Reply theme={'black'} />
		</View>
	</View>
));
