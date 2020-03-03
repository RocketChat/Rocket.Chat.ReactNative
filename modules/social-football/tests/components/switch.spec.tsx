import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {Switch} from "../../src/components/Switch";
import { Switch as NativeSwitch } from 'react-native';

describe('<Switch />', () => {
    it('should run without errors', () => {
        const component = shallow(<Switch />);
        const nativeSwitch = component.find(NativeSwitch);

        expect(nativeSwitch).toHaveLength(1);
    });
});
