import React from 'react';
import {shallow, mount, render} from 'enzyme';
import TimelinePage from "../../src/pages/TimelinePage";
import {AuthenticationQueries, ThreadsQueries} from "../../src/api";
import {MockedProvider, MockedResponse} from "@apollo/react-testing";
import {updateWrapper} from "../helpers/general";
import {InfiniteScrollView} from "../../src/components/InfiniteScrollView";
import {TimelineItem} from "../../src/components/TimelineItem";
import {ContentType} from "../../src/enums/content-type";

describe('<TimelinePage />', () => {

    const mocks: MockedResponse[] = [
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 6,
                },
            },
            result: {
                data: {
                    getThreads: {
                        threads: [
                            { _id: 1, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 2, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 3, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 4, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 5, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 6, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                        ],
                        limit: 6,
                        offset: 0,
                        total: 9,
                    },
                },
            },
        },
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 6,
                    offset: 6,
                }
            },
            result: {
                data: {
                    getThreads: {
                        threads: [
                            { _id: 7, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 8, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 9, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 9, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                        ],
                        limit: 6,
                        offset: 6,
                        total: 9,
                    }
                },
            },
        },
    ];

    it('should run without errors', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        expect(TimelinePage.navigationOptions({ navigation: jest.fn() }).headerTitle).toBeTruthy();
        expect(component).toBeTruthy();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(6);
    });

    it('should load more results when the end is reached', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        await updateWrapper(component);

        const infiniteScroll = component.find(InfiniteScrollView);
        infiniteScroll.props().onEndReached();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(9);
    });

    const mocksError: MockedResponse[] = [
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 6,
                },
            },
            result: {
                data: {
                    getThreads: {
                        threads: [
                            { _id: 1, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 2, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 3, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 4, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 5, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                            { _id: 6, title: 'Test thread', description: 'Description', type: ContentType.TEXT, assetUrl: null, assetMetadata: null, commentsEnabled: true, published: true, createdAt: new Date(), rocketChatMessageID: null },
                        ],
                        limit: 6,
                        offset: 0,
                        total: 9,
                    },
                },
            },
        },
        {
            request: {
                query: ThreadsQueries.TIMELINE,
                variables: {
                    limit: 6,
                    offset: 6,
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
                return <MockedProvider mocks={mocksError} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        await updateWrapper(component);

        const infiniteScroll = component.find(InfiniteScrollView);
        infiniteScroll.props().onEndReached();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(6);
    });

    it('should not load more results when item is still loading', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        const infiniteScroll = component.find(InfiniteScrollView);
        infiniteScroll.props().onEndReached();

        await updateWrapper(component, 1000);

        expect(component.find(TimelineItem)).toHaveLength(6);
    });
});
