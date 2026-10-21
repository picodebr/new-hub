/**
 * Gerador de Código Arduino (C++).
 * 
 * Este arquivo define como os blocos do Blockly são convertidos em código C++
 * compatível com o ecossistema Arduino/ESP32. Ele gerencia:
 * 1. Definição de prioridades de operadores (ORDEM).
 * 2. Organização do código em seções: includes, variáveis globais, setup() e loop().
 * 3. Tradução individual de blocos de hardware (servos, sensores, motores).
 */

import * as Blockly from 'blockly';

// Inicializa o gerador Arduino
export interface ArduinoGenerator {
    forBlock: Record<string, (block: Blockly.Block, generator: ArduinoGenerator) => string | [string, number] | null>;
    INDENT: string;
    definitions_: Record<string, string>;
    nameDB_: Blockly.Names;
    init: (workspace: Blockly.Workspace) => void;
    finish: (code: string) => string;
    scrub_: (block: Blockly.Block, code: string, opt_thisOnly?: boolean) => string;
    scratchBlocksToCode: (workspace: Blockly.Workspace) => string;
    blockToCode: (block: Blockly.Block | null) => string;
    workspaceToCode: (workspace: Blockly.Workspace) => string;
    valueToCode: (block: Blockly.Block, name: string, order: number) => string;
    statementToCode: (block: Blockly.Block, name: string) => string;
    prefixLines: (text: string, prefix: string) => string;
    ORDER_ATOMIC: number;
    ORDER_UNARY_POSTFIX: number;
    ORDER_UNARY_PREFIX: number;
    ORDER_MULTIPLICATIVE: number;
    ORDER_ADDITIVE: number;
    ORDER_SHIFT: number;
    ORDER_RELATIONAL: number;
    ORDER_EQUALITY: number;
    ORDER_BITWISE_AND: number;
    ORDER_BITWISE_XOR: number;
    ORDER_BITWISE_OR: number;
    ORDER_LOGICAL_AND: number;
    ORDER_LOGICAL_OR: number;
    ORDER_CONDITIONAL: number;
    ORDER_ASSIGNMENT: number;
    ORDER_COMMA: number;
    ORDER_NONE: number;
    [key: string]: unknown;
}

export const arduinoGenerator = new Blockly.Generator('Arduino') as unknown as ArduinoGenerator;

// Define constantes de prioridade de operadores para garantir parênteses corretos
export const Order = {
    ATOMIC: 0,         // 0 "" ...
    UNARY_POSTFIX: 1,  // expr++ expr-- () [] .
    UNARY_PREFIX: 2,   // -expr !expr ++expr --expr
    MULTIPLICATIVE: 3, // * / %
    ADDITIVE: 4,       // + -
    SHIFT: 5,          // << >> >>>
    RELATIONAL: 6,     // < > <= >=
    EQUALITY: 7,       // == != === !==
    BITWISE_AND: 8,    // &
    BITWISE_XOR: 9,    // ^
    BITWISE_OR: 10,    // |
    LOGICAL_AND: 11,   // &&
    LOGICAL_OR: 12,    // ||
    CONDITIONAL: 13,   // ? :
    ASSIGNMENT: 14,    // = += -= ...
    COMMA: 15,         // ,
    NONE: 99           // (...)
};

// Mapeia Order para a instância do gerador para compatibilidade retroativa
arduinoGenerator.ORDER_ATOMIC = Order.ATOMIC;
arduinoGenerator.ORDER_UNARY_POSTFIX = Order.UNARY_POSTFIX;
arduinoGenerator.ORDER_UNARY_PREFIX = Order.UNARY_PREFIX;
arduinoGenerator.ORDER_MULTIPLICATIVE = Order.MULTIPLICATIVE;
arduinoGenerator.ORDER_ADDITIVE = Order.ADDITIVE;
arduinoGenerator.ORDER_SHIFT = Order.SHIFT;
arduinoGenerator.ORDER_RELATIONAL = Order.RELATIONAL;
arduinoGenerator.ORDER_EQUALITY = Order.EQUALITY;
arduinoGenerator.ORDER_BITWISE_AND = Order.BITWISE_AND;
arduinoGenerator.ORDER_BITWISE_XOR = Order.BITWISE_XOR;
arduinoGenerator.ORDER_BITWISE_OR = Order.BITWISE_OR;
arduinoGenerator.ORDER_LOGICAL_AND = Order.LOGICAL_AND;
arduinoGenerator.ORDER_LOGICAL_OR = Order.LOGICAL_OR;
arduinoGenerator.ORDER_CONDITIONAL = Order.CONDITIONAL;
arduinoGenerator.ORDER_ASSIGNMENT = Order.ASSIGNMENT;
arduinoGenerator.ORDER_COMMA = Order.COMMA;
arduinoGenerator.ORDER_NONE = Order.NONE;

// =================================================================
// 1. INITIALIZATION & CLEANUP
// =================================================================

arduinoGenerator.init = function (workspace: Blockly.Workspace) {
    // Define palavras reservadas
    if (!arduinoGenerator.nameDB_) {
        arduinoGenerator.nameDB_ = new Blockly.Names("setup,loop,if,else,for,switch,case,while,do,break,continue,return,goto,define,include,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,integer,constants,floating,point,void,bookean,char,class,operator,template,public,private,protected,this,new,delete,try,throw,catch,null,true,false,nullptr");
    } else {
        arduinoGenerator.nameDB_.reset();
    }

    // Resolve aviso de depreciação: Names.prototype.getName sem definir um mapa de variáveis
    arduinoGenerator.nameDB_.setVariableMap(workspace.getVariableMap());

    arduinoGenerator.definitions_ = Object.create(null);
}

arduinoGenerator.scratchBlocksToCode = function (workspace: Blockly.Workspace) {
    // Resetar definições
    // arduinoGenerator.definitions_ = Object.create(null); // Agora feito no init

    // Força chamada do init padrão se necessário, mas workspaceToCode já deve chamar
    if (arduinoGenerator.init) {
        arduinoGenerator.init(workspace);
    }

    // Filtra Blocos de Topo: Apenas 'setup_block' e 'loop_block' devem conduzir a geração de código.
    // Ou geramos tudo e depois montamos.
    // O código original tinha um método 'finish' para montar.

    const code = arduinoGenerator.workspaceToCode(workspace);
    return arduinoGenerator.finish(code);
}

// --- FINALIZAÇÃO DO GERADOR (MONTAGEM DO CÓDIGO) ---
arduinoGenerator.finish = function (code: string) {
    // 1. Separa por tipo
    const includes: string[] = [];
    const variables: string[] = [];
    const setups: string[] = []; // Setups auto-gerados (pinMode, serial, etc)

    for (const name in arduinoGenerator.definitions_) {
        const def = arduinoGenerator.definitions_[name] as string;
        if (name.startsWith('include_')) {
            includes.push(def);
        } else if (name.startsWith('setup_')) {
            setups.push(def);
        } else {
            variables.push(def);
        }
    }

    // 3. Monta o Cabeçalho
    const header = includes.join('\n') + '\n\n' + variables.join('\n') + '\n\n';

    // 4. Extrai o Código de Setup do Usuário (do bloco setup_block)
    let finalCode = code;
    let userSetupCode = "";

    // Regex para encontrar conteúdo entre marcadores
    const setupRegex = /\/\/_SETUP_BLOCK_START([\s\S]*?)\/\/_SETUP_BLOCK_END/g;

    finalCode = finalCode.replace(setupRegex, function (match: string, content: string) {
        userSetupCode += content;
        return ""; // Remove do fluxo principal
    });

    // 5. Constrói a Função Setup Unificada
    arduinoGenerator.INDENT = '  '; // Garante indentação de 2 espaços
    const indent = arduinoGenerator.INDENT;

    // Formata setups sem newline extra no final
    let setupContent = setups.length > 0 ? indent + setups.join('\n' + indent) : "";

    // Adiciona o código do usuário se houver
    if (userSetupCode.trim()) {
        if (setupContent) setupContent += '\n'; // Apenas uma quebra se já houver conteúdo
        setupContent += userSetupCode.trimEnd(); // Remove novos espaços no fim para evitar quebras duplicadas
    }

    // Garante que o conteúdo termina com uma quebra se não estiver vazio para fechar a chave }
    if (setupContent) setupContent += '\n';

    const setupFunction = `// SETUP\nvoid setup() {\n${setupContent}}\n\n`;

    // 6. Limpa linhas vazias
    finalCode = finalCode.replace(/^\s*[\r\n]/gm, "");

    return header + setupFunction + finalCode;
};

// --- SCRUBBER (PÓS-PROCESSAMENTO) ---
 
arduinoGenerator.scrub_ = function (block: Blockly.Block, code: string, opt_thisOnly?: boolean) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = opt_thisOnly ? "" : arduinoGenerator.blockToCode(nextBlock);

    // FILTRO: Permite apenas blocos de topo específicos
    // Se este bloco não tem pai (é uma raiz) e NÃO é um tipo de raiz válido, suprime-o.
    if (!block.getParent()) {
        const validRoots = ['setup_block', 'loop_block'];
        // Também permite definições de procedimentos (funções)
        if (!validRoots.includes(block.type) && !block.type.startsWith('procedures_def')) {
            return "";
        }
    }

    const finalCode = code + nextCode;

    // Lógica Especial para Setup e Loop (Blocos de Chapéu)
    if (block.type === 'setup_block') {
        const indentedCode = arduinoGenerator.prefixLines(finalCode, arduinoGenerator.INDENT);
        return `\n//_SETUP_BLOCK_START\n${indentedCode}//_SETUP_BLOCK_END\n`;
    }
    if (block.type === 'loop_block') {
        const indentedCode = arduinoGenerator.prefixLines(finalCode, arduinoGenerator.INDENT);
        return `// LOOP\nvoid loop() {\n${indentedCode}}\n\n`;
    }

    return finalCode;
};

// --- BLOCOS DE ESTRUTURA ---
// Mantendo aqui pois são fundamentais para o gerador
arduinoGenerator.forBlock["setup_block"] = function (_block: Blockly.Block) {
    // Lógica tratada no scrub_
    return "";
};

arduinoGenerator.forBlock["loop_block"] = function (_block: Blockly.Block) {
    return ""; // tratado pelo scrub_
};
