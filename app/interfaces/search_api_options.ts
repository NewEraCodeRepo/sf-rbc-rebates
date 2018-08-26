export interface ISearchApiOptions {
  select: string[];
  query: string;
  offset: number;
  limit: number;
  order: IOrder;
}

export interface IOrder {
  by: string;
  direction: "DESC" | "ASC" | undefined;
}

export interface ISelect2FormatObject {
  id: string;
  text: string;
}

export interface ISelect2FormatResults {
  results: ISelect2FormatObject[];
  pagination: IPagination;
}

export interface IPagination {
  more: boolean;
}
