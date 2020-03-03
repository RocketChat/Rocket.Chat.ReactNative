import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {HeaderLogo} from "../../../src/components/header/HeaderLogo";

jest.mock('react-native', () => ({
    Platform: {
        OS: 'android',
    },
    StyleSheet: {
        create: () => ({}),
    },
    Image: () => <></>,
}));

describe('<HeaderLogo />', () => {
    it('should run without errors', () => {
        const component = shallow(<HeaderLogo />);

        expect(component).toBeTruthy();
    });
});
