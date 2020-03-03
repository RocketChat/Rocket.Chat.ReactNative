import React from 'react';
import {shallow, mount, render} from 'enzyme';
import { HeaderLeaderboardButton } from "../../../src/components/header/HeaderLeaderboardButton";
import {HeaderButton} from "../../../src/components/header/HeaderButton";

describe('<HeaderLeaderbordButton />', () => {
    it('should run without errors', () => {
        const component = shallow(<HeaderLeaderboardButton navigation={{}} />);

        component.find(HeaderButton).first().props().onPress();

        expect(component).toBeTruthy();
    });
});
