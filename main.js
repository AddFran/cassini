import { crearShader } from "./js/crearShader.js";
import {cargarTextura} from "./js/cargarTextura.js";
import {crearMalla} from "./js/crearMalla.js";
import * as m from "./js/operacionesMatrices.js";
import * as figure from "./js/crearFiguras.js";

const canvas=document.getElementById("glCanvas"); 
const gl=canvas.getContext("webgl2");

if(!gl){
    throw new Error("WebGL2 no está disponible en este navegador.");
}

gl.viewport(0,0,canvas.width,canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0); 
gl.enable(gl.DEPTH_TEST); 

const esfera=figure.crearEsfera(3.0,32,48);
//const esfera=figure.crearCubo(2);
//const esfera=figure.crearCilindro(1,4,32);
//const esfera=figure.crearPrismaTriangular(2,4);

const anillo=figure.crearAnillo(4,5,64)

const vertexShaderSource = `#version 300 es 
in vec3 aPosition; 
in vec3 aNormal;   
in vec2 aTexCoord; 

uniform mat4 uModelMatrix;      
uniform mat4 uViewMatrix;       
uniform mat4 uProjectionMatrix; 

out vec3 vNormal;   
out vec2 vTexCoord; 

void main() {
    // Ahora dividimos el trabajo porque vamos a trabajar con varios objetos
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
        // uModelMatrix contiene varias transformaciones (escala, rotacion y traslacion)
        // Transforma el vértice desde las coordenadas locales de la esfera hasta las coordenadas del mundo
    
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    
    // Actualizamos las normales del vertice
    vNormal = normalize(mat3(uModelMatrix) * aNormal);

    vTexCoord = aTexCoord;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float; 

in vec3 vNormal;
in vec2 vTexCoord;

uniform sampler2D uTexture;      
uniform vec3 uLightDirection;   
uniform bool uEmissive;

out vec4 outColor;

void main() {
    // Obtenemos el color respectivo segun la coordenada UV en formato RGB
    vec3 colorTextura = texture(uTexture, vTexCoord).rgb;
    
    // Verifica si el objeto es "emissive", osea si emite luz
        // Si lo hace, entonces la textura se aplica de forma limpia sin cambios ni aplicando sombreado
        // Si no, se calcula el sombreado como siempre
    if (uEmissive) {
        outColor = vec4(colorTextura, 1.0);
        return;
    }

    vec3 N = normalize(vNormal);            
    vec3 L = normalize(-uLightDirection);  

    float diffuse = max(dot(N, L), 0.0);
    float ambiente = 0.15;

    // Modifica el color final en base a todo lo anterior
    vec3 colorFinal = colorTextura * (ambiente + diffuse);

    outColor = vec4(colorFinal, 1.0);
}
`;

const vertexShader = crearShader(gl,gl.VERTEX_SHADER,vertexShaderSource);
const fragmentShader = crearShader(gl,gl.FRAGMENT_SHADER,fragmentShaderSource);

const program = gl.createProgram();

gl.attachShader(program, vertexShader);     
gl.attachShader(program, fragmentShader);   
gl.linkProgram(program);                   

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
        "Error al enlazar programa:\n" + gl.getProgramInfoLog(program)
    );
}

gl.useProgram(program);

const mallaSaturno = crearMalla(gl,program,esfera);
const mallaAnillo = crearMalla(gl,program,anillo);

const texturaSol = cargarTextura(gl,"texture/sol.jpg");
const texturaSaturno = cargarTextura(gl,"texture/saturno.jpg");
const texturaAnillo = cargarTextura(gl,"texture/anillo_saturno.png");

const modelMatrixLocation = gl.getUniformLocation(program,"uModelMatrix");
const viewMatrixLocation = gl.getUniformLocation(program,"uViewMatrix");
const projectionMatrixLocation = gl.getUniformLocation(program,"uProjectionMatrix");
const lightDirectionLocation = gl.getUniformLocation(program,"uLightDirection");
const textureLoc = gl.getUniformLocation(program, "uTexture");
const emissiveLoc = gl.getUniformLocation(program, "uEmissive");


const eye = [0.0, 3.0, 9.0];        
const target = [0.0, 0.0, 0.0];     
const up = [0.0, 1.0, 0.0];         

const viewMatrix=m.matrizLookAt(eye,target,up);

const fovGrados = 60;                           
const fovRadianes = fovGrados * Math.PI / 180;  
const aspect = canvas.width / canvas.height;    

const near = 0.1;  
const far = 100.0; 

const projectionMatrix = m.matrizPerspectiva(fovRadianes,aspect,near,far);

gl.uniformMatrix4fv(viewMatrixLocation,false,viewMatrix);
gl.uniformMatrix4fv(projectionMatrixLocation,false,projectionMatrix);

const lightDirection = m.normalizarVec3([-1.0, -0.5, -1.0]);
gl.uniform3fv(lightDirectionLocation, lightDirection);

gl.uniform1i(textureLoc, 0);

function dibujarCuerpo(textura, modelMatrix, emisivo, indicesLength) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textura);

    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.uniform1i(emissiveLoc, emisivo ? 1 : 0);

    gl.drawElements(
        gl.TRIANGLES,
        indicesLength,
        gl.UNSIGNED_SHORT,
        0
    );
}


let tiempoAnterior = 0;
let giroSaturno = 0;
let giroTierra = 0;

function render(ms) {
    const tiempo = ms * 0.001;
    const dt = tiempo - tiempoAnterior;
    tiempoAnterior = tiempo;

    giroSaturno += 0.10 * dt;
    giroTierra += 0.45 * dt;

    gl.clear(
        gl.COLOR_BUFFER_BIT |
        gl.DEPTH_BUFFER_BIT
    );

    gl.bindVertexArray(mallaSaturno.vao);

    const modelSaturno =
        m.multiplicarMat4(
            m.matrizRotacionY(giroSaturno),
            m.matrizEscala4(1.35, 1.35, 1.35)
        );

    dibujarCuerpo(
        texturaSaturno,
        modelSaturno,
        true,
        mallaSaturno.numIndices
    );

    gl.bindVertexArray(mallaAnillo.vao);

    const modelAnillo =
        m.multiplicarMat4(
            modelSaturno,
            m.matrizRotacionX(Math.PI/2)
    );

    dibujarCuerpo(
        texturaAnillo,
        modelAnillo,
        true,
        mallaAnillo.numIndices
    );

    gl.bindVertexArray(null);

    //dibujarCuerpo(texturaTierra,modelTierra,false);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);