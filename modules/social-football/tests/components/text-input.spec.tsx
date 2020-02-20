import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {TextInput} from "../../src/components/TextInput";
import { TextInput as NativeTextInput } from 'react-native';
import {appColors} from "../../src/theme/colors";
import {updateWrapper} from "../helpers/general";

describe('<TextInput />', () => {
    it('should run without errors', () => {
        const fn = jest.fn();

        const component = shallow(<TextInput onChangeText={fn} />);
        const nativeInput = component.find(NativeTextInput);

        nativeInput.first().props().onChangeText();

        expect(nativeInput).toBeTruthy();
        expect(fn).toHaveBeenCalled();
    });

    it('should notice the user a field has not been entered upon submit', () => {
        const component = shallow(<TextInput submitted={true} value={''} required={true} />);
        const nativeInput = component.find(NativeTextInput);

        expect(nativeInput).toBeTruthy();
        expect(JSON.stringify(nativeInput.prop('style'))).toContain(JSON.stringify({ borderColor: appColors.error }));
    });

    it('should notice the user a field has been cleared that was required', async () => {
        const component = shallow(<TextInput submitted={false} value={''} required={true} onChangeText={jest.fn()} />);
        let nativeInput = component.find(NativeTextInput);

        nativeInput.props().onChangeText();

        nativeInput = component.find(NativeTextInput);

        expect(nativeInput).toBeTruthy();
        expect(JSON.stringify(nativeInput.prop('style'))).toContain(JSON.stringify({ borderColor: appColors.error }));
    });
});
