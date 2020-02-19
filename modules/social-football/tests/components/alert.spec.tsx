import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {Alert} from "../../src/components/Alert";
import { Text } from 'react-native';

describe('<Alert />', () => {
    it('should run without errors', () => {
        const title = 'This is my alert!';

        const component = shallow(<Alert title={title} />);
        const text = component.find(Text);

        expect(text.prop('children')).toContain(title);
    });
});
