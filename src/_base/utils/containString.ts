interface IParams {
  source: string;
  search: string;
}

type FuncType = (params: IParams) => boolean;

export const containString: FuncType = ({ source, search }) =>
  source.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) >= 0;
