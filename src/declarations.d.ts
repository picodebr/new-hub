declare module 'styled-components' {
  const styled: any;
  export default styled;
  export const css: any;
  export const keyframes: any;
}

declare module 'antd' {
  export const Tour: any;
  export type TourProps = { steps?: any[] };
  export const Modal: any;
  export const Button: any;
  export const Input: any;
}

declare module 'openai' {
  export class OpenAI {
    constructor(config?: any);
    chat: any;
  }
  export default OpenAI;
}

declare module '@/components/LearnBotSimulator/interfaces' {
  export interface ILearnBotSimulator {
    [key: string]: any;
  }
  export interface ILearnBotElementLayout {
    [key: string]: any;
  }
}

declare namespace React {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean | string;
    global?: boolean | string;
  }
}


declare module '@/components/Inputs/Text' {
  export const TextInput: any;
}

declare module '@/components/Inputs/Select' {
  export const SelectInput: any;
}

declare module '@/components/Inputs/RadioInput' {
  export const RadioInput: any;
}
