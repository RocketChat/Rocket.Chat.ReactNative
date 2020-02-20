import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {TextInput} from 'react-native';
import LoginPage from "../../src/pages/LoginPage";
import {AuthenticationMutations} from "../../src/api";
import {MockedProvider} from "@apollo/react-testing";
import {updateWrapper} from "../helpers/general";
import {Alert} from "../../src/components/Alert";
import {act} from 'react-dom/test-utils';
import SecurityManager from '../../src/security/security-manager';

describe('<LoginPage />', () => {
    it('should render a login page', () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.LOGIN,
                },
                result: {
                    data: {
                        loginApp: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
            },
        ];

        const component = mount(<LoginPage navigation={{}} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        expect(component.find(TextInput)).toHaveLength(2);
    });

    it('should show a message when authentication failed', async () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.LOGIN,
                    variables: {
                        credentials: {
                            username: 'testuser',
                            password: 'testpassword',
                        },
                    },
                },
                result: {
                    data: {
                        loginApp: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
                error: new Error('Something went wrong.'),
            },
        ];

        const component = mount(<LoginPage navigation={{}} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        act(() => {
            component.find('#username').first().props().onChangeText('testuser');
            component.find('#password').first().props().onChangeText('testpassword');

            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 1000);

        expect(component.find(Alert)).toHaveLength(1);
    });

    it('should redirect when logged in', async () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.LOGIN,
                    variables: {
                        credentials: {
                            username: 'testuser',
                            password: 'testpassword',
                        },
                    },
                },
                result: {
                    data: {
                        loginApp: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
            },
        ];

        const spy = spyOn(SecurityManager, 'setLoggedIn');

        const component = mount(<LoginPage navigation={{}} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        act(() => {
            component.find('#username').first().props().onChangeText('testuser');
            component.find('#password').first().props().onChangeText('testpassword');
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 1000);

        expect(spy).toHaveBeenCalled();
    });

    it('should navigate the user to the register page', async () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.LOGIN,
                    variables: {
                        credentials: {
                            username: 'testuser',
                            password: 'testpassword',
                        },
                    },
                },
                result: {
                    data: {
                        loginApp: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
            },
        ];

        const spy = jest.fn();

        const component = mount(<LoginPage navigation={{ push: spy }} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        act(() => {
            component.find('#register').first().props().onPress();
        });

        await updateWrapper(component, 1000);

        expect(spy).toHaveBeenCalled();
    });
});

