import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {TextInput} from 'react-native';
import RegisterPage from "../../src/pages/RegisterPage";
import {AuthenticationMutations} from "../../src/api";
import {MockedProvider} from "@apollo/react-testing";
import {updateWrapper} from "../helpers/general";
import {Alert} from "../../src/components/Alert";
import {act} from 'react-dom/test-utils';
import SecurityManager from '../../src/security/security-manager';
import {ApolloError} from "apollo-client";

describe('<RegisterPage />', () => {
    it('should render a register form', () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.REGISTER,
                },
                result: {
                    data: {
                        register: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
            },
        ];

        const component = mount(<RegisterPage navigation={{}} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        expect(component.find(TextInput)).toHaveLength(5);
    });

    it('should show a message when registration failed due to a general reason', async () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.REGISTER,
                    variables: {
                        user: {
                            firstName: 'Robo',
                            lastName: 'Messi',
                            email: 'test@topteam.nl',
                            username: 'testuser',
                            password: 'testpassword',
                        },
                    },
                },
                result: {
                    data: {
                        register: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
                error: new Error('Something went wrong.'),
            },
        ];

        const component = mount(<RegisterPage navigation={{}} />, {
            wrappingComponent: ({children}) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        act(() => {
            component.find('#firstName').first().props().onChangeText('Robo');
            component.find('#lastName').first().props().onChangeText('Messi');
            component.find('#email').first().props().onChangeText('test@topteam.nl');
            component.find('#username').first().props().onChangeText('testuser');
            component.find('#password').first().props().onChangeText('testpassword');
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 200);

        expect(component.find(Alert)).toHaveLength(1);
    });

    it('should show a message when registration failed due to a GraphQL reason', async () => {
        const errorMessage = 'Some graphql error.';

        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.REGISTER,
                    variables: {
                        user: {
                            firstName: 'Robo',
                            lastName: 'Messi',
                            email: 'test@topteam.nl',
                            username: 'testuser',
                            password: 'testpassword',
                        },
                    },
                },
                result: {
                    errors: [{ message: errorMessage } as any],
                },
            },
        ];

        const component = mount(<RegisterPage navigation={{}} />, {
            wrappingComponent: ({children}) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        act(() => {
            component.find('#firstName').first().props().onChangeText('Robo');
            component.find('#lastName').first().props().onChangeText('Messi');
            component.find('#email').first().props().onChangeText('test@topteam.nl');
            component.find('#username').first().props().onChangeText('testuser');
            component.find('#password').first().props().onChangeText('testpassword');
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 200);

        const alert = component.find(Alert);
        expect(alert).toHaveLength(1);
        expect(alert.props().title).toBe(errorMessage);
    });

    it('should redirect when registered', async () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.REGISTER,
                    variables: {
                        user: {
                            firstName: 'Robo',
                            lastName: 'Messi',
                            email: 'test@topteam.nl',
                            username: 'testuser',
                            password: 'testpassword',
                        },
                    },
                },
                result: {
                    data: {
                        register: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
            },
        ];

        const spy = spyOn(SecurityManager, 'setLoggedIn');

        const component = mount(<RegisterPage navigation={{}} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        act(() => {
            component.find('#firstName').first().props().onChangeText('Robo');
            component.find('#lastName').first().props().onChangeText('Messi');
            component.find('#email').first().props().onChangeText('test@topteam.nl');
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

    it('should navigate the user to the login page', async () => {
        const mocks = [
            {
                request: {
                    query: AuthenticationMutations.REGISTER,
                    variables: {
                        user: {
                            firstName: 'Robo',
                            lastName: 'Messi',
                            email: 'test@topteam.nl',
                            username: 'testuser',
                            password: 'testpassword',
                        },
                    },
                },
                result: {
                    data: {
                        register: {
                            accessToken: '-',
                            refreshToken: '-',
                        },
                    },
                },
            },
        ];

        const spy = jest.fn();

        const component = mount(<RegisterPage navigation={{ pop: spy }} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        act(() => {
            component.find('#login').first().props().onPress();
        });

        await updateWrapper(component, 1000);

        expect(spy).toHaveBeenCalled();
    });
});

