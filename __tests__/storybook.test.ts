import React from 'react';
import { render } from '@testing-library/react-native';
import { composeStories } from '@storybook/react';
import type { Meta, StoryFn } from '@storybook/react';

import preview from '../.rnstorybook/preview';
import { initStore } from '../app/lib/store/auxStore';
import { mockedStore } from '../app/reducers/mockedStore';

initStore(mockedStore);

type StoryFile = {
	default: Meta;
	[name: string]: StoryFn | Meta;
};

const compose = (entry: StoryFile): ReturnType<typeof composeStories<StoryFile>> => {
	try {
		return composeStories(entry, {
			decorators: preview.decorators
		});
	} catch (e) {
		throw new Error(`There was an issue composing stories for the module: ${JSON.stringify(entry)}, ${e}`);
	}
};

// Import all story files
import * as AvatarStories from '../app/containers/Avatar/Avatar.stories';
import * as BackgroundContainerStories from '../app/containers/BackgroundContainer/index.stories';
import * as ButtonStories from '../app/containers/Button/Button.stories';
import * as ChipStories from '../app/containers/Chip/Chip.stories';
import * as CollapsibleTextStories from '../app/containers/CollapsibleText/CollapsibleText.stories';
import * as HeaderButtonStories from '../app/containers/Header/components/HeaderButton/HeaderButtons.stories';
import * as ListStories from '../app/containers/List/List.stories';
import * as LoginServicesStories from '../app/containers/LoginServices/LoginServices.stories';
import * as MarkdownStories from '../app/containers/markdown/Markdown.stories';
import * as CollapsibleQuoteStories from '../app/containers/message/Components/Attachments/CollapsibleQuote/CollapsibleQuote.stories';
import * as MessageStories from '../app/containers/message/Message.stories';
import * as ReactionsListStories from '../app/containers/ReactionsList/ReactionsList.stories';
import * as RoomHeaderStories from '../app/containers/RoomHeader/RoomHeader.stories';
import * as RoomItemStories from '../app/containers/RoomItem/RoomItem.stories';
import * as RoomTypeIconStories from '../app/containers/RoomTypeIcon/RoomTypeIcon.stories';
import * as SearchBoxStories from '../app/containers/SearchBox/SearchBox.stories';
import * as ServerItemStories from '../app/containers/ServerItem/ServerItem.stories';
import * as StatusStories from '../app/containers/Status/Status.stories';
import * as TextInputStories from '../app/containers/TextInput/TextInput.stories';
import * as UiKitMessageStories from '../app/containers/UIKit/UiKitMessage.stories';
import * as UiKitModalStories from '../app/containers/UIKit/UiKitModal.stories';
import * as UnreadBadgeStories from '../app/containers/UnreadBadge/UnreadBadge.stories';
import * as CannedResponseItemStories from '../app/views/CannedResponsesListView/CannedResponseItem.stories';
import * as SwitchItemStories from '../app/views/CreateChannelView/RoomSettings/SwitchItem.stories';
import * as DiscussionItemStories from '../app/views/DiscussionsView/Item.stories';
import * as LoadMoreStories from '../app/views/RoomView/LoadMore/LoadMore.stories';
import * as ThreadItemStories from '../app/views/ThreadMessagesView/Item.stories';

const allStoryModules = [
	{ stories: AvatarStories, name: 'Avatar' },
	{ stories: BackgroundContainerStories, name: 'BackgroundContainer' },
	{ stories: ButtonStories, name: 'Button' },
	{ stories: ChipStories, name: 'Chip' },
	{ stories: CollapsibleTextStories, name: 'CollapsibleText' },
	{ stories: HeaderButtonStories, name: 'HeaderButton' },
	{ stories: ListStories, name: 'List' },
	{ stories: LoginServicesStories, name: 'LoginServices' },
	{ stories: MarkdownStories, name: 'Markdown' },
	{ stories: CollapsibleQuoteStories, name: 'CollapsibleQuote' },
	{ stories: MessageStories, name: 'Message' },
	{ stories: ReactionsListStories, name: 'ReactionsList' },
	{ stories: RoomHeaderStories, name: 'RoomHeader' },
	{ stories: RoomItemStories, name: 'RoomItem' },
	{ stories: RoomTypeIconStories, name: 'RoomTypeIcon' },
	{ stories: SearchBoxStories, name: 'SearchBox' },
	{ stories: ServerItemStories, name: 'ServerItem' },
	{ stories: StatusStories, name: 'Status' },
	{ stories: TextInputStories, name: 'TextInput' },
	{ stories: UiKitMessageStories, name: 'UiKitMessage' },
	{ stories: UiKitModalStories, name: 'UiKitModal' },
	{ stories: UnreadBadgeStories, name: 'UnreadBadge' },
	{ stories: CannedResponseItemStories, name: 'CannedResponseItem' },
	{ stories: SwitchItemStories, name: 'SwitchItem' },
	{ stories: DiscussionItemStories, name: 'DiscussionItem' },
	{ stories: LoadMoreStories, name: 'LoadMore' },
	{ stories: ThreadItemStories, name: 'ThreadItem' }
];

describe('Story Snapshots', () => {
	allStoryModules.forEach(({ stories: storyFile, name: componentName }) => {
		const meta = storyFile.default;
		const title = meta?.title || componentName;

		describe(title, () => {
			const stories = Object.entries(compose(storyFile)).map(([name, story]) => ({ name, story }));
			console.log(stories);

			if (stories.length <= 0) {
				throw new Error(
					`No stories found for this module: ${title}. Make sure there is at least one valid story for this module.`
				);
			}

			stories.forEach(({ name, story }) => {
				test(`${name} should match snapshot`, async () => {
					// The composed story already includes decorators from preview.tsx
					console.log(story);
					const rendered = render(React.createElement(story as React.ComponentType));

					// Wait for component to render completely
					await new Promise(resolve => setTimeout(resolve, 1));

					expect(rendered.toJSON()).toMatchSnapshot();
				});
			});
		});
	});
});
