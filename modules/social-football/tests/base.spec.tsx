import React, { createRef } from 'react';
import { shallow } from 'enzyme';
import {SocialFootballModule} from "../src";
import { ApolloProvider } from 'react-apollo';
import { Navigation } from '../src/navigation';
import SecurityManager from "../src/security/security-manager";
import {mocked} from "ts-jest/utils";

jest.mock('../src/security/security-manager');

const mockedSecurity = mocked(SecurityManager);

describe('<SocialFootballModule />', () => {
    it('should provide an ApolloProvider', () => {
        jest.mock('../src/navigation', () => {
            return {
                Navigation: ({ children }) => <>{children}</>,
            }
        });

        mockedSecurity.init.mockImplementation(async () => { return });

        const ref = createRef();
        const component = shallow(<SocialFootballModule ref={ref} />);

        expect(component.find(ApolloProvider)).toHaveLength(1);
    });
});
