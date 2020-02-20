import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {Button} from "../../src/components/Button";
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';

describe('<Button />', () => {
    it('should run without errors', () => {
        const title = 'This is my label.';
        const fn = jest.fn();

        const component = shallow(<Button title={title} onPress={fn} />);
        const text = component.find(Text);

        component.find(TouchableOpacity).first().props().onPress();

        expect(text.prop('children')).toContain(title);
        expect(fn).toBeCalled();
    });

    it('should show a loader', () => {
        const title = 'This is my label.';

        const component = shallow(<Button title={title} loading={true} />);

        expect(component.find(Text)).toHaveLength(0);
        expect(component.find(ActivityIndicator)).toHaveLength(1);
    });
});
