import styled from 'styled-components/native';
import Touch from '../../../utils/touch';

export const Container = styled(Touch)`
  background-color: #e1e5e8;
  width: 50px;
  height: 50px;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  margin-bottom: 15px;
  border-radius: 2px;
  opacity: ${ props => (props.disabled ? 0.5 : 1) }
`;
