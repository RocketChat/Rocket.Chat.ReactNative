import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {KeyboardUtilityView} from "../../src/components/KeyboardUtilityView";
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

describe('<KeyboardUtilityView />', () => {
    it('should run without errors', () => {
        const title = 'This is my label.';
        const spy = spyOn(Keyboard, 'dismiss');

        const component = shallow(<KeyboardUtilityView />);
        component.find(TouchableWithoutFeedback).first().props().onPress();

        expect(spy).toHaveBeenCalled();
    });
});
