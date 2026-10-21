/**
 * IProjectRepository - Contrato de persistência para projetos PicoCode Hub.
 * 
 * Responsabilidade: Definir a interface para salvamento e recuperação de dados 
 * dos projetos, permitindo diferentes implementações de armazenamento (Browser, 
 * Nuvem, Local Storage).
 */
import { ProjectData } from "../entities/Project";

export interface IProjectRepository {
    save(project: ProjectData): Promise<void>;
    load(id: string): Promise<ProjectData | null>;
    getAll(): Promise<ProjectData[]>;
    delete(id: string): Promise<void>;
    getRecent(): Promise<ProjectData | null>;
}
