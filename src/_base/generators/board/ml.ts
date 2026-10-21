/**
 * Tradução para C++ dos blocos de Machine Learning (via comunicação Serial).
 *
 * Protocolo Serial: o browser envia "classe:porcentagem\n" (ex: "gato:95.3\n").
 * Se não houver ":", trata toda a string como nome de classe (porcentagem padrão = 100).
 */
import * as Blockly from 'blockly';
import { arduinoGenerator } from './generator';

// Definições compartilhadas injetadas por qualquer bloco ML upload
function injectMLDefs() {
    arduinoGenerator.definitions_['setup_serial'] = 'Serial.begin(9600);';
    arduinoGenerator.definitions_['var_ml_state'] = 'String mlLastClass = "";\nfloat mlLastConfidence = 0.0;';
    arduinoGenerator.definitions_['func_read_ml_serial'] = `void readMLSerial() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\\n');
    line.trim();
    int sep = line.indexOf(':');
    if (sep > 0) {
      mlLastClass = line.substring(0, sep);
      mlLastConfidence = line.substring(sep + 1).toFloat();
    } else {
      mlLastClass = line;
      mlLastConfidence = 100.0;
    }
  }
}`;
}

// =================================================================
// ML UPLOAD — Quando receber classe via Serial
// =================================================================
arduinoGenerator.forBlock["ml_upload_on_class"] = function (block: Blockly.Block) {
    const className = block.getFieldValue('CLASS') || '';
    const doCode = arduinoGenerator.statementToCode(block, 'DO');
    injectMLDefs();
    const code =
        `readMLSerial();
if (mlLastClass == "${className}") {
${doCode}}
`;
    return code;
};

// =================================================================
// ML UPLOAD — Booleano "classe X detectada"
// =================================================================
arduinoGenerator.forBlock["ml_upload_current_class"] = function (block: Blockly.Block) {
    const className = block.getFieldValue('CLASS') || '';
    injectMLDefs();
    const code = `(readMLSerial(), mlLastClass == "${className}")`;
    return [code, arduinoGenerator.ORDER_COMMA];
};

// =================================================================
// ML UPLOAD — String "classe identificada"
// =================================================================
arduinoGenerator.forBlock["ml_upload_identified_class"] = function (_block: Blockly.Block) {
    injectMLDefs();
    const code = `(readMLSerial(), mlLastClass)`;
    return [code, arduinoGenerator.ORDER_COMMA];
};

// =================================================================
// ML UPLOAD — Número "porcentagem de X"
// =================================================================
arduinoGenerator.forBlock["ml_upload_get_confidence"] = function (block: Blockly.Block) {
    const className = block.getFieldValue('CLASS') || '';
    injectMLDefs();
    const code = `(readMLSerial(), mlLastClass == "${className}" ? mlLastConfidence : 0.0)`;
    return [code, arduinoGenerator.ORDER_COMMA];
};
