/**
 * LocalStorageProjectRepository - Persistência local no navegador.
 * 
 * Responsabilidade: Implementar o armazenamento de longa duração dos projetos 
 * utilizando o LocalStorage do browser. Garante a continuidade do trabalho 
 * entre sessões, gerindo a serialização de objetos complexos do projeto.
 * 
 * Operações Principais:
 * - save/load: Gestão do ciclo de vida dos dados em formato JSON.
 * - getRecent: Recuperação automática do último projeto editado para carga inicial.
 */
import { IProjectRepository } from "../domain/ports/IProjectRepository";
import { ProjectData } from "../domain/entities/Project";

export class LocalStorageProjectRepository implements IProjectRepository {
    private readonly STORAGE_KEY = 'picode_projects';

    async save(project: ProjectData): Promise<void> {
        const projects = await this.getAll();
        const index = projects.findIndex(p => p.id === project.id);
        
        if (index >= 0) {
            projects[index] = { ...project, updatedAt: Date.now() };
        } else {
            projects.push({ ...project, updatedAt: Date.now() });
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    }

    async load(id: string): Promise<ProjectData | null> {
        const projects = await this.getAll();
        return projects.find(p => p.id === id) || null;
    }

    async getAll(): Promise<ProjectData[]> {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Error parsing projects from localStorage", e);
            return [];
        }
    }

    async delete(id: string): Promise<void> {
        const projects = await this.getAll();
        const filtered = projects.filter(p => p.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }

    async getRecent(): Promise<ProjectData | null> {
        const projects = await this.getAll();
        if (projects.length === 0) return null;
        return projects.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    }
}
