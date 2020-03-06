import React, { createRef } from 'react';
import { mount } from 'enzyme';
import { ActivityIndicator } from 'react-native';
import {
    AuthenticatedNavigation,
    LoadingNavigation,
    Navigation,
    pages,
    UnaunthenticatedNavigation
} from '../src/navigation';
import SecurityManager from "../src/security/security-manager";
import {mocked} from "ts-jest/utils";
import {BehaviorSubject} from "rxjs";
import {updateWrapper} from "./helpers/general";

jest.mock('../src/security/security-manager');

const mockedSecurity = mocked(SecurityManager);

describe('<Navigation />', () => {
    it('should show an activity indicator when login state is not ready', async () => {
        const subject = new BehaviorSubject(null);
        mockedSecurity.login$ = subject.asObservable();

        const ref = createRef();
        const component = mount(<Navigation ref={ref} />);

        expect(component.find(LoadingNavigation)).toHaveLength(1);
    });

    it('should show authenticated nav when authenticated', () => {
        const subject = new BehaviorSubject(true);
        mockedSecurity.login$ = subject.asObservable();

        const ref = createRef();
        const component = mount(<Navigation ref={ref} />);

        expect(component.find(AuthenticatedNavigation)).toHaveLength(1);
    });

    it('should show unauthenticated nav when not authenticated', () => {
        const subject = new BehaviorSubject(false);
        mockedSecurity.login$ = subject.asObservable();

        const ref = createRef();
        const component = mount(<Navigation ref={ref} />);

        expect(component.find(UnaunthenticatedNavigation)).toHaveLength(1);
    });

    it('should load pages correctly', () => {
        const pageGroups = Object.values(pages);

        pageGroups.forEach(group => {
            Object.values(group).forEach((page: any) => {
                if (page.getScreen) {
                    page.getScreen();
                }
                if (page.navigationOptions) {
                    page.navigationOptions({});
                }
            });
        })
    });
});
