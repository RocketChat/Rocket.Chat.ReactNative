import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {HeaderLogo} from "../../../src/components/header/HeaderLogo";

describe('<HeaderLogo />', () => {
    it('should run without errors', () => {
        const component = shallow(<HeaderLogo />);

        expect(component).toBeTruthy();
    });
});
