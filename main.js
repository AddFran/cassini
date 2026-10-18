import { crearShader } from "./js/crearShader.js";
import {cargarTextura} from "./js/cargarTextura.js";
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

const anillo=figure.crearAnillo(1,2,64)

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

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER,esfera.vertices,gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,esfera.indices,gl.STATIC_DRAW);

const stride=8*Float32Array.BYTES_PER_ELEMENT;

// Posicion
const positionLocation = gl.getAttribLocation(program,"aPosition");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,stride,0);

// Normal
const normalLocation = gl.getAttribLocation(program, "aNormal");
gl.enableVertexAttribArray(normalLocation);
gl.vertexAttribPointer(normalLocation,3,gl.FLOAT,false,stride,3*Float32Array.BYTES_PER_ELEMENT);

// UV
const texCoordLocation = gl.getAttribLocation(program, "aTexCoord");
gl.enableVertexAttribArray(texCoordLocation);
gl.vertexAttribPointer(texCoordLocation,2,gl.FLOAT,false,stride,6*Float32Array.BYTES_PER_ELEMENT);

const texturaSol = cargarTextura(gl,"texture/sol.jpg");
const texturaSaturno = cargarTextura(gl,"texture/saturno.jpg");

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

function dibujarCuerpo(textura, modelMatrix, emisivo) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textura);

    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
    gl.uniform1i(emissiveLoc, emisivo ? 1 : 0);

    gl.drawElements(
        gl.TRIANGLES,
        esfera.indices.length,
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

    gl.bindVertexArray(vao);

    const modelSaturno =
        m.multiplicarMat4(
            m.matrizRotacionY(giroSaturno),
            m.matrizEscala4(1.35, 1.35, 1.35)
        );

    dibujarCuerpo(
        texturaSaturno,
        modelSaturno,
        true
    );

    const modelTierra =
        m.multiplicarMat4(
            m.matrizTraslacion4(3.0, 0.0, 0.0),
            m.multiplicarMat4(
                m.matrizRotacionY(giroTierra),
                m.matrizEscala4(0.55, 0.55, 0.55)
            )
        );

    //dibujarCuerpo(texturaTierra,modelTierra,false);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);