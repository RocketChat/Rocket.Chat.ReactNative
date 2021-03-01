/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved, import/extensions, react/prop-types */
import React from 'react';
import { ScrollView } from "react-native";
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
    color: 'red',
    ts: "1970-01-01T00:00:00.000Z",
	author_name: "John Doe",
	text: "This is a sample message",
    fields: [
      {
        title: "Attachment's title:",
        value: "Lorem ipsum dolor sit amet",
        short: true
      },
	  {
        title: "Attachment's title:",
		value: "[Link](https://google.com/) something and this and that.",
        short: true,
      }
    ],
  };

const Reply = ({theme, ...props}) => (
	<MessageContext.Provider
		value={{
			user,
			baseUrl,
		}}
	>
		<ThemeContext.Provider value={theme}>
			<ReplyComponent theme={theme} attachment={item} timeFormat="LT" {...props} />
		</ThemeContext.Provider>
	</MessageContext.Provider>
);

stories.add('content', () => (
	<ScrollView style={{margin: 16}}>
		<Reply theme={'light'} attachment={{ ...item, color: 'green' }}/>
		<Reply 
			theme={'light'} 
			attachment={{
							...item, 
							color: 'orange',
							fields:
								[
									{
										title: "Attachment's title:",
										value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce sit amet aliquet augue. Nulla malesuada enim ac magna pharetra viverra. Cras enim massa, tincidunt ac porta in, pharetra quis metus. Nam at imperdiet lorem. Interdum et malesuada fames ac ante ipsum primis in faucibus. Vestibulum ut diam diam. Maecenas elementum tristique tristique. Sed egestas arcu sit amet mattis ultrices. Nam auctor sit amet massa eu volutpat. In at ultrices elit. Mauris venenatis metus arcu.",
										short: false
									}, 
								]
						}}
		/>
		<Reply theme={'light'} />
		<Reply theme={'light'} />
		<Reply theme={'light'} />
	</ScrollView>
));

stories.add('themes', () => (
	<>
		<ThemeStory theme={themes.light} />
		<ThemeStory theme={themes.dark} />
		<ThemeStory theme={themes.black} />
	</>
));
