import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {HeaderCreateThreadButton} from "../../../src/components/header/HeaderCreateThreadButton";
import {HeaderButton} from "../../../src/components/header/HeaderButton";

describe('<HeaderCreateThreadButton />', () => {
    it('should run without errors', () => {
        const fn = jest.fn();
        const navigation = { push: fn };

        const component = shallow(<HeaderCreateThreadButton navigation={navigation} />);

        component.find(HeaderButton).first().props().onPress();

        expect(fn).toBeCalledWith('CreateThreadPage');
    });
});
