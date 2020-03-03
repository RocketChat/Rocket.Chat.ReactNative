import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {KeyboardUtilityView} from "../../src/components/KeyboardUtilityView";
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

describe('<KeyboardUtilityView />', () => {
    it('should run without errors', () => {
        const spy = spyOn(Keyboard, 'dismiss');

        const component = shallow(<KeyboardUtilityView />);
        component.find(TouchableWithoutFeedback).first().props().onPress();

        expect(spy).toHaveBeenCalled();
    });

    it('should support vertical centering', () => {
        const spy = spyOn(Keyboard, 'dismiss');

        const component = shallow(<KeyboardUtilityView centerVertically={true} />);
        component.find(TouchableWithoutFeedback).first().props().onPress();

        expect(spy).toHaveBeenCalled();
    });
});
