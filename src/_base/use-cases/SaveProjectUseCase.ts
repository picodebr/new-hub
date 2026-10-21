/**
 * SaveProjectUseCase - Caso de uso para persistência de projetos com metadados.
 * 
 * Responsabilidade: Validar o estado do projeto, enriquecer com informações de 
 * timestamp e versão, e delegar a gravação física para o repositório de dados.
 */
import { IProjectRepository } from "../domain/ports/IProjectRepository";
import { ProjectData } from "../domain/entities/Project";

export class SaveProjectUseCase {
    constructor(private projectRepository: IProjectRepository) {}

    public async execute(project: ProjectData): Promise<void> {
        if (!project.name) {
            throw new Error('O projeto deve ter um nome para ser salvo.');
        }
        
        // Enriquece os metadados do projeto com timestamp e versão antes de salvar
        const enrichedProject = {
            ...project,
            updatedAt: Date.now(),
            metadata: {
                version: project.metadata?.version || "1.0.0",
                timestamp: new Date().toISOString()
            }
        };
        
        await this.projectRepository.save(enrichedProject);
    }
}
