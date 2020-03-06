import React from 'react';
import { shallow, mount, render } from 'enzyme';
import TimelinePage from "../../src/pages/TimelinePage";
import { AuthenticationQueries, ThreadsQueries } from "../../src/api";
import { MockedProvider, MockedResponse } from "@apollo/react-testing";
import { updateWrapper } from "../helpers/general";
import { InfiniteScrollView } from "../../src/components/InfiniteScrollView";
import { TimelineItem } from "../../src/components/TimelineItem";
import { ContentType } from "../../src/enums/content-type";
import { Text } from 'react-native';

describe('<TimelinePage />', () => {

    const mocks: MockedResponse[] = [
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 10,
                },
            },
            result: {
                data: {
                    getThreads: {
                        __typename: 'PaginatedThreads',
                        threads: [
                            { __typename: 'Thread', _id: '1', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '2', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '3', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '4', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '5', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '6', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '7', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '8', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '9', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '10', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                        ],
                        limit: 10,
                        offset: 0,
                        total: 14,
                    },
                },
            },
        },
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 6,
                    offset: 10,
                }
            },
            result: {
                data: {
                    getThreads: {
                        __typename: 'PaginatedThreads',
                        threads: [
                            { __typename: 'Thread', _id: '11', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '12', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '13', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '14', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '14', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                        ],
                        limit: 6,
                        offset: 10,
                        total: 14,
                    }
                },
            },
        },
    ];

    it('should run without errors', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={true}>
                    {children}
                </MockedProvider>;
            },
        });

        expect(TimelinePage.navigationOptions({ navigation: jest.fn() }).headerTitle).toBeTruthy();
        expect(component).toBeTruthy();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(10);
    });

    it('should load more results when the end is reached', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={true}>
                    {children}
                </MockedProvider>;
            },
        });

        await updateWrapper(component, 1000);

        const infiniteScroll = component.find(InfiniteScrollView);
        infiniteScroll.props().onEndReached();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(14);
    });

    it('should have a refresh button', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={true}>
                    {children}
                </MockedProvider>;
            },
        });

        await updateWrapper(component, 1000);

        const refresh = component.find(InfiniteScrollView).props().refreshControl;
        refresh.props.onRefresh();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(10);
    });

    const mocksError: MockedResponse[] = [
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 10,
                },
            },
            result: {
                data: {
                    getThreads: {
                        __typename: 'PaginatedThreads',
                        threads: [
                            { __typename: 'Thread', _id: '1', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '2', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '3', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '4', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '5', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '6', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '7', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '8', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '9', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { __typename: 'Thread', _id: '10', title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                        ],
                        limit: 10,
                        offset: 0,
                        total: 12,
                    },
                },
            },
        },
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 6,
                    offset: 10,
                }
            },
            result: {
                data: null,
            },
        },
    ];

    it('should not merge results when new results are not valid', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocksError} addTypename={true}>
                    {children}
                </MockedProvider>;
            },
        });

        await updateWrapper(component);

        const infiniteScroll = component.find(InfiniteScrollView);
        infiniteScroll.props().onEndReached();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(10);
    });

    it('should not load more results when item is still loading', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={true}>
                    {children}
                </MockedProvider>;
            },
        });

        const infiniteScroll = component.find(InfiniteScrollView);
        infiniteScroll.props().onEndReached();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(10);
    });

    const emptyMocks: MockedResponse[] = [
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 10,
                },
            },
            result: {
                data: {
                    getThreads: {
                        __typename: 'PaginatedThreads',
                        threads: [
                        ],
                        limit: 10,
                        offset: 0,
                        total: 0,
                    },
                },
            },
        },
    ];

    it('should show a message when there are no results', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={emptyMocks} addTypename={true}>
                    {children}
                </MockedProvider>;
            },
        });

        await updateWrapper(component, 0);

        expect(component.find(Text)).not.toHaveLength(0);
    });
});
