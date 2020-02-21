import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {HeaderSaveThreadButton} from "../../../src/components/header/HeaderSaveThreadButton";
import {HeaderButton} from "../../../src/components/header/HeaderButton";

describe('<HeaderSaveThreadButton />', () => {
    it('should run without errors', () => {
        const fn = jest.fn();
        const navigation = { push: fn };

        const component = shallow(<HeaderSaveThreadButton navigation={navigation} />);

        component.find(HeaderButton).first().props().onPress();

        expect(component).toBeTruthy();
    });
});
