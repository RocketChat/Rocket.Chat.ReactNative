import { store } from '../store/auxStore';
import { useSetting } from './useSetting';

export const useConferenceWindow = (): boolean => useSetting('VideoConf_Conference_Window_Enabled') === true;

export const isConferenceWindowEnabled = (): boolean => store.getState().settings.VideoConf_Conference_Window_Enabled === true;
