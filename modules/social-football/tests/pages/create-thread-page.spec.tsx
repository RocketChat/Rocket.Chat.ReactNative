import React from 'react';
import {shallow, mount} from 'enzyme';
import CreateThreadPage from "../../src/pages/CreateThreadPage";
import {updateWrapper} from "../helpers/general";
import {act} from 'react-dom/test-utils';
import {ContentTypeButton} from "../../src/components/ContentTypeButton";

describe('<CreateThreadPage />', () => {
    it('should run without errors', () => {
        const component = shallow(<CreateThreadPage />);

        expect(component).toBeTruthy();
    });

    it('should submit the form for a link', async () => {
        const component = mount(<CreateThreadPage />);

        expect(component).toBeTruthy();

        act(() => {
            component.find('#title').first().props().onChangeText('A new text!');
            component.find('#description').first().props().onChangeText('This is a very cool text.');
            component.find('#commentsEnabled').first().props().onValueChange(true);
            component.find('#type-LINK').first().props().onPress();
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#link').first().props().onChangeText('https://tue.nl');
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 200);
    });

    it('should submit the form for a YouTube video', async () => {
        const component = mount(<CreateThreadPage />);

        expect(component).toBeTruthy();

        act(() => {
            component.find('#title').first().props().onChangeText('A new text!');
            component.find('#description').first().props().onChangeText('This is a very cool text.');
            component.find('#commentsEnabled').first().props().onValueChange(true);
            component.find('#type-YOUTUBE').first().props().onPress();
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#youtube').first().props().onChangeText('https://www.youtube.com/watch?v=44wisHopGu0');
        });

        await updateWrapper(component, 1000);

        act(() => {
            component.find('#submit').first().props().onPress();
        });

        await updateWrapper(component, 200);
    });
});
