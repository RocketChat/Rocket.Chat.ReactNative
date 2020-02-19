import {act} from 'react-dom/test-utils';

/** from https://spectrum.chat/apollo/react-apollo/still-getting-act-warnings-with-react-16-9-and-apollo-3-1-0-and-enzyme-3-10-0~22f92c2d-0e9e-4048-bab3-093ece5c2dc0?m=MTU2ODQwMDk4MTQzMw== */
export const updateWrapper = async (wrapper, time = 20) => {
    await act(async () => {
        await new Promise((res) => setTimeout(res, time));
        await wrapper.update();
    });
};
