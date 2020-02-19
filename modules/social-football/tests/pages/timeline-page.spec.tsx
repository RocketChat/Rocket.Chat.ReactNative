import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {Button, Text} from 'react-native';
import TimelinePage from "../../src/pages/TimelinePage";
import SecurityManager from '../../src/security/security-manager';
import {AuthenticationQueries} from "../../src/api";
import {MockedProvider} from "@apollo/react-testing";
import {updateWrapper} from "../helpers/general";

describe('<TimelinePage />', () => {
    const username = 'robomessi';

    const mocks = [
        {
            request: {
                query: AuthenticationQueries.GET_ME,
            },
            result: {
                data: {
                    me: username,
                },
            },
        },
    ];

    it('should run without errors', () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        const button = component.find(Button);

        expect(button).toHaveLength(1);
    });

    it('should logout', () => {
        const logoutSpy = spyOn(SecurityManager, 'logout');

        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });
        const button = component.find(Button);

        button.props().onPress();

        expect(logoutSpy).toHaveBeenCalled();
    });

    it('should show the authenticated username', async () => {
        const component = mount(<TimelinePage navigation={null} />, {
            wrappingComponent: ({ children }) => {
                return <MockedProvider mocks={mocks} addTypename={false}>
                    {children}
                </MockedProvider>;
            },
        });

        await updateWrapper(component);

        const text = component.find(Text);

        expect(text.props().children).toContain(username);
    });
});
