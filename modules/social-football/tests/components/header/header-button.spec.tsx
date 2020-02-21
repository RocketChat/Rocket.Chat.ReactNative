import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {HeaderButton} from "../../../src/components/header/HeaderButton";
import { Text, TouchableOpacity } from 'react-native';

describe('<HeaderButton />', () => {
    it('should run without errors', () => {
        const fn = jest.fn();

        const component = shallow(<HeaderButton image={null} onPress={fn} />);

        component.find(TouchableOpacity).first().props().onPress();

        expect(fn).toBeCalled();
    });
});
