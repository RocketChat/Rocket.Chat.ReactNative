import React from 'react';
import {mount} from 'enzyme';
import CreateThreadPage from "../../src/pages/CreateThreadPage";
import {updateWrapper} from "../helpers/general";
import {act} from 'react-dom/test-utils';
import {ThreadsMutations, ThreadsQueries} from "../../src/api";
import {MockedProvider, MockedResponse} from "@apollo/react-testing";
import {ContentType} from "../../src/enums/content-type";
import { ThemeContext } from '../../../../app/theme';
import {Alert} from "../../src/components/Alert";
import { ImagePicker } from '../../src/components/ImagePicker';

describe('<CreateThreadPage />', () => {
    const mocks: MockedResponse[] = [
        {
            request: {
                query: ThreadsQueries.PREVIEW_METADATA,
            },
            result: {
                data: {
                    getPreviewMetadata: null,
                },
            },
        },
        {
            request: {
                query: ThreadsQueries.PREVIEW_METADATA,
                variables: {
                    url: 'https://tue.nl',
                    type: ContentType.LINK,
                }
            },
            result: {
                data: {
                    getPreviewMetadata: {
                        url: 'https://tue.nl',
                        title: 'TUE',
                        description: '',
                        image: null,
                    },
                },
            },
        },
        {
            request: {
                query: ThreadsQueries.PREVIEW_METADATA,
                variables: {
                    url: 'https://www.youtube.com/watch?v=-wOdL7HFNOs',
                    type: ContentType.YOUTUBE,
                }
            },
            result: {
                data: {
                    getPreviewMetadata: {
                        url: 'https://www.youtube.com/watch?v=-wOdL7HFNOs',
                        title: 'YouTube',
                        description: '',
                        image: null,
                    },
                },
            },
        },
        {
            request: {
                query: ThreadsMutations.CREATE_THREAD,
            },
            result: {
                data: {
                    createThread: false,
                },
            },
        },
        {
            request: {
                query: ThreadsMutations.CREATE_THREAD,
                variables: {
                    thread: {
                        title: 'A new text!',
                        description: 'This is a very cool text.',
                        commentsEnabled: true,
                        type: ContentType.LINK,
                        assetUrl: 'https://tue.nl',
                        published: false,
                        assetFile:{}
                    }
                },
            },
            result: {
                data: {
                    createThread: false,
                },
            },
        },
        {
            request: {
                query: ThreadsMutations.CREATE_THREAD,
                variables: {
                    thread: {
                        title: 'A new text!',
                        description: 'This is a very cool text.',
                        commentsEnabled: true,
                        type: ContentType.YOUTUBE,
                        assetUrl: 'https://www.youtube.com/watch?v=-wOdL7HFNOs',
                        published: false,
                        assetFile:{}
                    }
                },
            },
            result: {
                data: {
                    createThread: false,
                },
            },
        },
        {
            request: {
                query: ThreadsMutations.CREATE_THREAD,
                variables: {
                    thread: {
                        title: 'A new text!',
                        description: 'This is a very cool text.',
                        commentsEnabled: true,
                        type: ContentType.IMAGE,
                        assetUrl: undefined,
                        published: false,
                        assetFile: { uri: '/test.jpg', type: 'image/jpg', name: 'test.jpg' },
                    }
                },
            },
            result: {
                data: {
                    createThread: false,
                },
            },
        },
        {
            request: {
                query: ThreadsMutations.CREATE_THREAD,
                variables: {
                    thread: {
                        title: 'A new text!',
                        description: 'This is a very cool text.',
                        commentsEnabled: true,
                        type: ContentType.TEXT,
                        assetUrl: undefined,
                        published: false,
                        assetFile:{}
                    }
                },
            },
            result: {
                data: {
                    createThread: false,
                },
            },
        },
        {
            request: {
                query: ThreadsMutations.CREATE_THREAD,
                variables: {
                    thread: {
                        title: 'Something',
                        description: 'Did go wrong',
                        commentsEnabled: true,
                        type: ContentType.TEXT,
                        assetUrl: undefined,
                        published: false,
                        assetFile:{}
                    }
                },
            },
            error: new Error(),
            result: {
                data: {
                    createThread: false,
                },
            },
        },
    ];

    it.each([[ContentType.LINK, {}], [ContentType.YOUTUBE, {}], [ContentType.TEXT, {}], [ContentType.IMAGE, { path: '/test.jpg', mime: 'image/jpg', filename: 'test.jpg' }], [ContentType.IMAGE, { path: '/test.jpg', mime: 'image/jpg' }]])('should submit the form for a %s', async (type, imageData) => {
        const fn = jest.fn();

        const component = mount(<CreateThreadPage navigation={{ pop: fn }} />, {
            wrappingComponent: ({ children }) => {
                return <ThemeContext.Provider value={{ theme: 'dark' } as any}><MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider></ThemeContext.Provider>;
            },
        });

        expect(component).toBeTruthy();
        expect(CreateThreadPage.navigationOptions({ navigation: jest.fn() }).headerTitle).toBeTruthy();

        act(() => {
            component.find('#title').first().props().onChangeText('A new text!');
            component.find('#description').first().props().onChangeText('This is a very cool text.');
            component.find('#commentsEnabled').first().props().onValueChange(true);
            component.find(`#type-${type}`).first().props().onPress();
        });

        await updateWrapper(component, 1000);

        act(() => {
            if (component.find('#link').length > 0) {
                component.find('#link').first().props().onChangeText('https://tue.nl');
            }

            if (component.find('#youtube').length > 0) {
                component.find('#youtube').first().props().onChangeText('https://www.youtube.com/watch?v=-wOdL7HFNOs');
            }
        });

        await updateWrapper(component, 1000);

        if (type === ContentType.IMAGE) {
            act(() => {
                const image = component.find(ImagePicker);
                image.props().onChange(imageData);
            });

            await updateWrapper(component, 1000);
        }

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 200);

        expect(fn).toHaveBeenCalled();
    });

    it.each([ContentType.LINK, ContentType.YOUTUBE, ContentType.TEXT, ContentType.IMAGE])('should not submit the form when not valid for a %s', async (type) => {
        const fn = jest.fn();

        const component = mount(<CreateThreadPage navigation={{ pop: fn }} />, {
            wrappingComponent: ({ children }) => {
                return <ThemeContext.Provider value={{ theme: 'dark' } as any}><MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider></ThemeContext.Provider>;
            },
        });

        expect(component).toBeTruthy();
        expect(CreateThreadPage.navigationOptions({ navigation: jest.fn() }).headerTitle).toBeTruthy();

        act(() => {
            component.find('#description').first().props().onChangeText('This is a very cool text.');
            component.find('#commentsEnabled').first().props().onValueChange(true);
            component.find(`#type-${type}`).first().props().onPress();
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 1000);

        expect(fn).not.toHaveBeenCalled();
    });

    it('should show an error for when something went wrong', async () => {
        const component = mount(<CreateThreadPage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <ThemeContext.Provider value={{ theme: 'dark' } as any}><MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider></ThemeContext.Provider>;
            },
        });

        expect(component).toBeTruthy();
        expect(CreateThreadPage.navigationOptions({ navigation: jest.fn() }).headerTitle).toBeTruthy();

        act(() => {
            component.find('#title').first().props().onChangeText('Something');
            component.find('#description').first().props().onChangeText('Did go wrong');
            component.find('#commentsEnabled').first().props().onValueChange(true);
            component.find(`#type-TEXT`).first().props().onPress();
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 200);

        expect(component.find(Alert)).toHaveLength(1);
    });
});
