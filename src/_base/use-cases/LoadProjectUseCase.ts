/**
 * LoadProjectUseCase - Caso de uso para recuperação e hidratação de projetos.
 * 
 * Responsabilidade: Coordenar a leitura de dados brutos do repositório, 
 * mapeamento para a entidade Project e registro dinâmico de blocos customizados 
 * (procedimentos) que pertencem ao projeto carregado.
 */
import { IProjectRepository } from "../domain/ports/IProjectRepository";
import { ProjectData } from "../domain/entities/Project";
import { registerCustomBlockFromSpec } from "../config/custom_definitions";

export class LoadProjectUseCase {
    constructor(private repository: IProjectRepository) {}

    async execute(projectId: string): Promise<ProjectData | null> {
        const project = await this.repository.load(projectId);
        if (!project) return null;

        // Registra blocos customizados (procedimentos) caso existam nos metadados do projeto
        if (project.customProcedures) {
            project.customProcedures.forEach((proc) => {
                try {
                    registerCustomBlockFromSpec(proc);
                } catch (e) {
                    console.error("Erro ao registrar bloco customizado do projeto", proc.id, e);
                }
            });
        }

        return project;
    }
}
