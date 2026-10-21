/**
 * Shaders.ts
 * Gerenciamento e código fonte dos Shaders 2D do PiCode.
 */

export const VERTEX_SHADER_SOURCE = `#version 300 es
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;

out vec2 v_texCoord;

void main() {
    gl_Position = u_projectionMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

// Fragment shader com suporte aos efeitos de Scratch (ghost, color, brightness, etc)
export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform float u_ghost;      // 0.0 a 1.0
uniform float u_brightness; // -1.0 a 1.0
uniform float u_color;      // Hue rotate 0.0 a 360.0
uniform vec4 u_silhouetteColor; // Cor do brilho/outline

// Conversão RGB <-> HSV
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 texColor = texture(u_image, v_texCoord);
    
    // Se totalmente transparente, descarta pra evitar custos de shading
    if(texColor.a < 0.01) {
        discard;
    }

    // Se estivermos desenhando a sombra da seleção (outline)
    if (u_silhouetteColor.a > 0.0) {
        outColor = vec4(u_silhouetteColor.rgb * texColor.a, texColor.a * u_silhouetteColor.a);
        return;
    }

    // IMPORTANTE: Como UNPACK_PREMULTIPLY_ALPHA_WEBGL é false (padrão do WebGL), 
    // texColor já contém Straight RGB do canvas/imagem.
    // NÃO divida por texColor.a senão as bordas anti-aliased ficarão super expostas (brilhantes).
    vec3 rgb = texColor.rgb;

    // Efeito Color (Hue Rotate) (Scratch value é de 0 a 200, mapeado no JS de 0 a 360 graus)
    if (u_color > 0.0) {
        vec3 hsv = rgb2hsv(rgb);
        hsv.x = fract(hsv.x + u_color / 360.0);
        rgb = hsv2rgb(hsv);
    }

    // Efeito Brightness 
    if (u_brightness > 0.0) {
        rgb = mix(rgb, vec3(1.0), u_brightness);
    } else if (u_brightness < 0.0) {
        rgb = mix(rgb, vec3(0.0), -u_brightness);
    }

    // Aplicar a opacidade global (Ghost) e output com alpha pré-multiplicado novamente 
    // porque o blend mode do WebGLRenderer usamos gl.ONE, gl.ONE_MINUS_SRC_ALPHA
    float alpha = texColor.a * (1.0 - u_ghost);
    outColor = vec4(rgb * alpha, alpha);
}
`;

export class ShaderManager {
    static compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Erro ao criar shader.");
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const err = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Falha compilando shader: ' + err);
        }
        return shader;
    }

    static createProgram(gl: WebGL2RenderingContext, vSource: string, fSource: string): WebGLProgram {
        const vertexShader = ShaderManager.compileShader(gl, gl.VERTEX_SHADER, vSource);
        const fragmentShader = ShaderManager.compileShader(gl, gl.FRAGMENT_SHADER, fSource);

        const program = gl.createProgram();
        if (!program) throw new Error("Erro ao criar programa GL.");
        
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const err = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error('Falha ligando programa: ' + err);
        }

        return program;
    }
}
