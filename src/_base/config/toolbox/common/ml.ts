/**
 * Configuração dinâmica da categoria de Machine Learning.
 */
import { BlockBuilder, CategoryBuilder } from "../../../lib/blockly/BlockBuilder";

/**
 * Categoria Machine Learning
 * 
 * Contém blocos e controles para o classificador de imagem baseado em IA.
 */
export const getMachineLearningCategory = (hasModel: boolean) => {
    const cat = new CategoryBuilder("Vision Lab", "#D94D4D")
        .withIcon('/svg/cerebro.svg')
        // 1. Botões de ambiente sempre disponíveis para gerenciar
        .addButton(hasModel ? 'Trocar Ambiente ml' : 'Abrir Ambiente ML', 'OPEN_ML_ENV');

    // Se houver modelo ativo carregado, mostra o botão de edição (se aplicável) e os blocos de uso
    if (hasModel) {
        cat
            // 2. Classificador de Mídia - Configurações
            .addLabel('Configurações')
            .addBlock(new BlockBuilder('ml_open_recognition_window'))
            .addBlock(new BlockBuilder('ml_close_recognition_window'))

            // 3. Detecção
            .addLabel('Detecção')
            .addBlock(new BlockBuilder('ml_is_identified_class')
                .withField('CLASS', '')
            )
            .addBlock(new BlockBuilder('ml_identified_class'))
            .addBlock(new BlockBuilder('ml_get_confidence')
                .withField('CLASS', '')
            )
            .addBlock(new BlockBuilder('ml_when_predicted')
                .withField('CLASS', '')
            );
    }

    return cat;
};
