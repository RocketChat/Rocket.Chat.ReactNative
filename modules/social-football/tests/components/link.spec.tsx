import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {Link} from "../../src/components/Link";
import { Text, TouchableOpacity } from 'react-native';

describe('<Link />', () => {
    it('should run without errors', () => {
        const title = 'This is my label.';
        const fn = jest.fn();

        const component = shallow(<Link title={title} onPress={fn} />);
        const text = component.find(Text);

        component.find(TouchableOpacity).first().props().onPress();

        expect(text.prop('children')).toContain(title);
        expect(fn).toBeCalled();
    });
});
