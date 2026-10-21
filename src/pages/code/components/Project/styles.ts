import styled from 'styled-components';

export const Content = styled.div`
  max-width: 100%;
  width: 25rem;
  margin: auto;

  display: flex;
  flex-direction: column;
  padding: 0.5rem 1rem;
  width: 100%;
  min-height: 1rem;
  overflow: hidden;
  transition: min-height 0.5s;

  & > :nth-child(n + 2) {
    margin: 0;
  }

  &[data-select-opened='true'] {
    min-height: 16.5rem;
  }
  & > :nth-child(n + 2) {
    margin-top: 0.5rem;
  }

  @media (max-width: ${(props) => props.theme.breakingPoints.mobile}px) {
    min-width: auto;
  }
`;

export const BottomContent = styled.div`
  display: flex;
  column-gap: 1.125rem;
  align-items: flex-end;

  & > :last-child {
    margin-bottom: -0.4rem;
  }
`;
