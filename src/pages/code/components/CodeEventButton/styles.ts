import styled from 'styled-components';

interface IContainer {
  label: string;
}

export const Container = styled.button<IContainer>`
  --labelTranslate: translateY(50%);
  --labelOpacity: 0;
  --generalIconSize: 1.5rem;
  --simulationIconSize: 1.7rem;
  --undoRedoIconSize: 1.075rem;
  --toTextIconSize: 1.875rem;

  border-radius: 0.35rem;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  user-select: none;
  padding: 0.65rem 0.25rem;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: ${props => props.theme.dimensions.desktopHeader}px;
  color: ${props => props.theme.colors.headerButton};

  svg {
    font-size: var(--generalIconSize);
  }

  @media (min-width: ${props => props.theme.breakingPoints.smallDesktop}px) {
    &:after {
      transition: all 0.15s;
      content: '${props => props.label}';
      position: absolute;
      transform: var(--labelTranslate);
      opacity: var(--labelOpacity);
      pointer-events: none;
    }
  }

  &:hover {
    --labelTranslate: translateY(100%);
    --labelOpacity: 1;

    color: ${props => props.theme.colors.text};
  }

  &[data-hide='true'] {
    display: none;
  }

  &[data-disabled='true'] {
    pointer-events: none;
    opacity: 0.8;
    filter: grayscale(0.8);
  }

  &[data-type='simulation'] {
    svg {
      font-size: var(--simulationIconSize);
    }
  }

  &[data-type='undo'] {
    svg {
      font-size: var(--undoRedoIconSize);
    }
  }

  &[data-type='redo'] {
    margin: 0 0.25rem;
    svg {
      font-size: var(--undoRedoIconSize);
      transform: scaleX(-1);
    }
  }

  &[data-type='toText'] {
    svg {
      font-size: var(--toTextIconSize);
    }
  }

  @media (max-width: ${props => props.theme.breakingPoints.mobile}px) {
    --generalIconSize: 1.2rem;
    --simulationIconSize: 1.4rem;
    --undoRedoIconSize: 1rem;
    --toTextIconSize: 1.5rem;

    &[data-type='redo'] {
      margin: 0;
    }
  }
`;
