import { IProjectAnnotationMetadata } from './IProjectAnnotationMetadata';

export interface IAddProjectAnnotationParams {
  hub_project_class_id: string;
  metadata: IProjectAnnotationMetadata;
}

export interface IUpdateProjectAnnotationParams {
  id: string;
  metadata: IProjectAnnotationMetadata;
}
