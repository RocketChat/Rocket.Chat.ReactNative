import React from 'react';
import {shallow, mount, render} from 'enzyme';
import {ImagePicker} from "../../src/components/ImagePicker";
import { Text } from 'react-native';
import {ThreadModel} from "../../src/models/threads";
import {ContentType} from "../../src/enums/content-type";
import { TouchableOpacity } from 'react-native';
import ActionSheet from 'react-native-action-sheet';
import BaseImagePicker, { Image } from 'react-native-image-crop-picker';
import { updateWrapper } from '../helpers/general';
import { mocked } from 'ts-jest/utils';
import { appColors } from '../../src/theme/colors';

jest.mock('react-native-action-sheet');

jest.mock('react-native-image-crop-picker', () => {
    console.log('factory');
    return {
        openCamera: async () => {
            return { path: '' } as Image;
        },
        openPicker: async () => {
            return { path: '' } as Image;
        },
    }
});

const mockedActionSheet = mocked(ActionSheet, true);

describe('<ImagePicker />', () => {
    it('should run without errors and be able to take a photo', async () => {
        const fn = jest.fn();

        mockedActionSheet.showActionSheetWithOptions.mockImplementation((options, callback) => {
            callback(1); // photo
        });

        const component = shallow(<ImagePicker onChange={fn} />);
        const mainTouch = component.find(TouchableOpacity).first();

        mainTouch.props().onPress();

        await updateWrapper(component);

        expect(component).toBeTruthy();
        expect(mockedActionSheet.showActionSheetWithOptions).toBeCalled();
        expect(fn).toBeCalledWith({ path: '' });
    });

    it('should run without errors and be able to take a photo and remove it again', async () => {
        const fn = jest.fn();

        mockedActionSheet.showActionSheetWithOptions.mockImplementation((options, callback) => {
            callback(1); // photo
        });

        const component = shallow(<ImagePicker onChange={fn} />);
        const mainTouch = component.find(TouchableOpacity).first();

        mainTouch.props().onPress();

        await updateWrapper(component);

        const removeButton = component.find('#remove').first();
        removeButton.props().onPress();

        expect(component).toBeTruthy();
        expect(mockedActionSheet.showActionSheetWithOptions).toBeCalled();
        expect(fn).toBeCalledWith({ path: '' });
        expect(fn).toBeCalledWith(null);
    });

    it('should run without errors and be able to choose from library', async () => {
        mockedActionSheet.showActionSheetWithOptions.mockImplementation((options, callback) => {
            callback(2); // library
        });

        const component = shallow(<ImagePicker />);
        const mainTouch = component.find(TouchableOpacity).first();

        mainTouch.props().onPress();

        await updateWrapper(component);

        expect(component).toBeTruthy();
        expect(mockedActionSheet.showActionSheetWithOptions).toBeCalled();
    });

    it('should run without errors and be able to cancel when selecting image', async () => {
        const fn = jest.fn();

        mockedActionSheet.showActionSheetWithOptions.mockImplementation((options, callback) => {
            callback(0); // library
        });

        const component = shallow(<ImagePicker onChange={fn} />);
        const mainTouch = component.find(TouchableOpacity).first();

        mainTouch.props().onPress();

        await updateWrapper(component);

        expect(component).toBeTruthy();
        expect(mockedActionSheet.showActionSheetWithOptions).toBeCalled();
        expect(fn).not.toHaveBeenCalled();
    });

    it('should run show an error when form was submitted and no image selected', async () => {
        const component = shallow(<ImagePicker submitted={true} required={true} />);
        const mainTouch = component.find(TouchableOpacity).first();

        expect(mainTouch.props().style).toContainEqual(expect.objectContaining({
            borderColor: appColors.error,
        }));
    });
});
