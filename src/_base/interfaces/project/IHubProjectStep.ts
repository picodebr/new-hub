export interface IHubProjectStep {
  title: string;
  parent?: string;
  color?: string;
  description: string | null;
  position: number;
  cashback?: string;
  requires_file_submission?: boolean;
}
