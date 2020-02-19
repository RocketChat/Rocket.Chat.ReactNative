import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ShallowWrapper from 'enzyme/ShallowWrapper';

configure({ adapter: new Adapter() });
ShallowWrapper.prototype.until = ShallowWrapper;

jest.mock('react-native', () => require('react-native-mock-render'), {virtual: true});
