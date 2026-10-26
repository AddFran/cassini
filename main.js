import { crearShader } from "./js/crearShader.js";
import {cargarTextura} from "./js/cargarTextura.js";
import {crearMalla} from "./js/crearMalla.js";
import * as m from "./js/operacionesMatrices.js";
import * as figure from "./js/crearFiguras.js";
import * as draw from "./js/dibujarCuerpo.js";

import{Draw} from "./js/dibujarCuerpo.js";

const canvas=document.getElementById("glCanvas"); 
const gl=canvas.getContext("webgl2");

if(!gl){
    throw new Error("WebGL2 no está disponible en este navegador.");
}

gl.viewport(0,0,canvas.width,canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0); 
gl.enable(gl.DEPTH_TEST); 

const esfera=figure.crearEsfera(1,32,48);
const esferaFondo=figure.crearEsfera(80,48,96);
//const esfera=figure.crearCubo(2);
//const esfera=figure.crearCilindro(1,4,32);
//const esfera=figure.crearPrismaTriangular(2,4);
//const esfera=figure.crearCono(2,1);

const anillo=figure.crearAnillo(2,3,128);
const cubo=figure.crearCubo(1);
const cilindro=figure.crearCilindro(1,1,64);
const prisma=figure.crearPrismaTriangular(1,1);
const cono1=figure.crearCono(1,1,64);

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
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
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
    vec3 colorTextura = texture(uTexture, vTexCoord).rgb;

    if (uEmissive) {
        outColor = vec4(colorTextura, 1.0);
        return;
    }

    vec3 N = normalize(vNormal);            
    vec3 L = normalize(-uLightDirection);  
    float diffuse = max(dot(N, L), 0.0);
    float ambiente = 0.15;
    vec3 colorFinal = colorTextura * (ambiente + diffuse);
    outColor = vec4(colorFinal, 1.0);
}
`;

const vertexShader=crearShader(gl,gl.VERTEX_SHADER,vertexShaderSource);
const fragmentShader=crearShader(gl,gl.FRAGMENT_SHADER,fragmentShaderSource);

const program=gl.createProgram();

gl.attachShader(program,vertexShader);     
gl.attachShader(program,fragmentShader);   
gl.linkProgram(program);                   

if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
    throw new Error(
        "Error al enlazar programa:\n" + gl.getProgramInfoLog(program)
    );
}

gl.useProgram(program);


const mallaSaturno=crearMalla(gl,program,esfera);
const mallaAnillo=crearMalla(gl,program,anillo);
const mallaFondo=crearMalla(gl,program,esferaFondo);

const mallaCilindro=crearMalla(gl,program,cilindro);
const mallaCono1=crearMalla(gl,program,cono1);
const mallaPrisma=crearMalla(gl,program,prisma);
const mallaCubo=crearMalla(gl,program,cubo);


const texturaSol=cargarTextura(gl,"texture/sol.jpg");
const texturaSaturno=cargarTextura(gl,"texture/saturno.jpg",gl.REPEAT,gl.REPEAT);
const texturaAnillo=cargarTextura(gl,"texture/anillo_saturno.png",gl.CLAMP_TO_EDGE,gl.REPEAT);
const texturaFondo=cargarTextura(gl,"texture/fondo_universo.jpg",gl.CLAMP_TO_EDGE,gl.REPEAT);

const texturaDorado=cargarTextura(gl,"texture/cassiniDorado.jpg",gl.REPEAT,gl.REPEAT);
const texturaDorado2=cargarTextura(gl,"texture/cassiniDorado2.jpg",gl.REPEAT,gl.REPEAT);
const texturaPlomo=cargarTextura(gl,"texture/cassiniEstandar.jpg",gl.REPEAT,gl.REPEAT);


const modelMatrixLocation = gl.getUniformLocation(program,"uModelMatrix");
const viewMatrixLocation = gl.getUniformLocation(program,"uViewMatrix");
const projectionMatrixLocation = gl.getUniformLocation(program,"uProjectionMatrix");
const lightDirectionLocation = gl.getUniformLocation(program,"uLightDirection");
const textureLoc = gl.getUniformLocation(program, "uTexture");
const emissiveLoc = gl.getUniformLocation(program, "uEmissive");


const camera={
    target: [0.0, 0.0, 0.0],

    distancia: 11.5,
    azimut: 0.0,
    elevacion: 0.42,

    distanciaMin: 3.0,
    distanciaMax: 25.0,

    sensibilidadMouse: 0.008,
    sensibilidadZoom: 0.0025
};
function limitar(valor,minimo,maximo){
    return Math.max(minimo,Math.min(maximo,valor));
}
function obtenerEyeCamara(){
    const cosElevacion=Math.cos(camera.elevacion);
    const x=camera.target[0]+camera.distancia*cosElevacion*Math.sin(camera.azimut);
    const y=camera.target[1]+camera.distancia*Math.sin(camera.elevacion);
    const z=camera.target[2]+camera.distancia*cosElevacion*Math.cos(camera.azimut);
    return [x,y,z];
}
function obtenerViewCamara(){
    const eye=obtenerEyeCamara();
    return m.matrizLookAt(eye,camera.target,[0.0,1.0,0.0]);
}
let arrastrando=false;
let mouseAnteriorX=0;
let mouseAnteriorY=0;

canvas.addEventListener("mousedown",(evento) => {
    arrastrando=true;
    mouseAnteriorX=evento.clientX;
    mouseAnteriorY=evento.clientY;
    canvas.classList.add("arrastrando");
});
window.addEventListener("mouseup",() => {
    arrastrando=false;
    canvas.classList.remove("arrastrando");
});
window.addEventListener("mousemove",(evento) => {
    if(!arrastrando) return;

    const dx=evento.clientX-mouseAnteriorX;
    const dy=evento.clientY-mouseAnteriorY;

    mouseAnteriorX=evento.clientX;
    mouseAnteriorY=evento.clientY;

    camera.azimut-=dx*camera.sensibilidadMouse;
    camera.elevacion+=dy*camera.sensibilidadMouse;

    const limiteVertical=Math.PI/2-0.05;

    //camera.elevacion = limitar(camera.elevacion,-limiteVertical,limiteVertical);
});
canvas.addEventListener("wheel", (evento) => {
    evento.preventDefault();
    camera.distancia+=evento.deltaY * camera.sensibilidadZoom;

    //camera.distancia = limitar(camera.distancia,camera.distanciaMin,camera.distanciaMax);
}, { passive: false });

const fovGrados = 60;                           
const fovRadianes = fovGrados * Math.PI / 180;  
const aspect = canvas.width / canvas.height;    

const near = 0.1;  
const far = 100.0; 

//const projectionMatrix = m.matrizPerspectiva(fovRadianes,aspect,near,far);

//
const projectionMatrix = m.matrizPerspectiva(fovRadianes,aspect,near,far);

gl.useProgram(program);

// La proyección se configura una vez al inicio
gl.uniformMatrix4fv(projectionMatrixLocation,false,projectionMatrix);

// La dirección de la luz
const lightDirection = m.normalizarVec3([-1.0, -0.5, -1.0]);
gl.uniform3fv(lightDirectionLocation, lightDirection);

gl.uniform1i(textureLoc, 0);

function dibujarCuerpo(textura,modelMatrix,emisivo,indicesLength){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,textura);
    gl.uniformMatrix4fv(modelMatrixLocation,false,modelMatrix);
    gl.uniform1i(emissiveLoc, emisivo ? 1 : 0);
    gl.drawElements(gl.TRIANGLES,indicesLength,gl.UNSIGNED_SHORT,0);
}
function dibujarFondo() {
    // Dibujar la esfera desde su interior
    gl.bindVertexArray(mallaFondo.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturaFondo);
    gl.uniform1i(textureLoc, 0);

    // La textura no debe recibir iluminación
    gl.uniform1i(emissiveLoc, 1);

    // Evitar que el fondo escriba en profundidad
    const profundidadAnterior = gl.getParameter(gl.DEPTH_WRITEMASK);
    gl.depthMask(false);

    // Mostrar también las caras interiores
    const cullingAnterior = gl.isEnabled(gl.CULL_FACE);
    gl.disable(gl.CULL_FACE);

    // La esfera permanece centrada en el origen
    const eye = obtenerEyeCamara();
    const modelFondo = m.matrizTraslacion4(eye[0],eye[1],eye[2]);
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelFondo);

    gl.drawElements(gl.TRIANGLES,mallaFondo.numIndices,gl.UNSIGNED_SHORT,0);

    // Restaurar el estado de WebGL
    gl.depthMask(profundidadAnterior);

    if(cullingAnterior){
        gl.enable(gl.CULL_FACE);
    }

    gl.bindVertexArray(null);
}


let tiempoAnterior=0;
let giroSaturno=0;
let giroTierra=0;

let giroCassini=0;

function render(ms) {
    const tiempo=ms*0.001;
    const dt=tiempo-tiempoAnterior;
    tiempoAnterior=tiempo;

    giroSaturno+=0.10*dt;
    giroTierra+=0.45*dt;

    giroCassini+=0.5*dt;

    gl.clear(
        gl.COLOR_BUFFER_BIT |
        gl.DEPTH_BUFFER_BIT
    );

    // Actualizar la cámara según el mouse
    const viewMatrix=obtenerViewCamara();
    gl.useProgram(program);
    gl.uniformMatrix4fv(viewMatrixLocation,false,viewMatrix);

    dibujarFondo();

    // Saturno
    const modelSaturno=m.multiplicarMat4(
        m.matrizTraslacion4(-10,-20,-100),
        m.multiplicarMat4(
            m.matrizRotacionY(giroSaturno),
            m.matrizEscala4(50,50,50)
        )
    );
    gl.bindVertexArray(mallaSaturno.vao);
    const saturnoDraw=new Draw(gl,modelMatrixLocation,emissiveLoc,texturaSaturno,modelSaturno,false,mallaSaturno.numIndices,null);
    saturnoDraw.dibujarCuerpo();
    //dibujarCuerpo(texturaSaturno,modelSaturno,false,mallaSaturno.numIndices);

    // Anillo
    const modelAnillo=m.multiplicarMat4(
        modelSaturno,
        m.matrizRotacionX(Math.PI/2)
    );
    gl.bindVertexArray(mallaAnillo.vao);
    dibujarCuerpo(texturaAnillo,modelAnillo,true,mallaAnillo.numIndices);

    // Cassini

    // Cilindro principal (main)
    const modelCassiniMain=m.multiplicarMat4(m.matrizRotacionY(0),m.matrizEscala4(1,2.5,1));
    
    gl.bindVertexArray(mallaCilindro.vao);
    dibujarCuerpo(texturaDorado,modelCassiniMain,false,mallaCilindro.numIndices);

    // Antena Main
    const localAntenaMain=m.multiplicarMat4(
        m.matrizTraslacion4(0,0.4,0),
        m.matrizEscala4(0.05,1,0.05)
    );
    const modelAntenaMain=m.multiplicarMat4(modelCassiniMain,localAntenaMain);
    dibujarCuerpo(texturaPlomo,modelAntenaMain,false,mallaCilindro.numIndices);

    // Antena Main1
    const localAntenaMain1=m.multiplicarMat4(
        m.matrizTraslacion4(0,0.88,0),
        m.matrizEscala4(0.1,0.03,0.1)
    );
    const modelAntenaMain1=m.multiplicarMat4(modelCassiniMain,localAntenaMain1);
    dibujarCuerpo(texturaPlomo,modelAntenaMain1,false,mallaCilindro.numIndices);

    // Base Antena Main
    const localBaseAntenaMain=m.multiplicarMat4(
        m.matrizTraslacion4(0,0.52,0),
        m.matrizEscala4(0.88,0.02,0.88)
    );
    const modelBaseAntenaMain=m.multiplicarMat4(modelCassiniMain,localBaseAntenaMain);
    dibujarCuerpo(texturaPlomo,modelBaseAntenaMain,false,mallaCilindro.numIndices);

    // Soporte Base
    const localBaseSoporte=m.multiplicarMat4(
        m.matrizTraslacion4(0,-0.55,0),
        m.matrizEscala4(0.6,0.1,0.6)
    );
    const modelBaseSoporte=m.multiplicarMat4(modelCassiniMain,localBaseSoporte);
    dibujarCuerpo(texturaPlomo,modelBaseSoporte,false,mallaCilindro.numIndices);

    // Soporte Base 2
    const localBaseSoporte2=m.multiplicarMat4(
        m.matrizTraslacion4(0,-0.5,0),
        m.matrizEscala4(0.7,0.08,0.7)
    );
    const modelBaseSoporte2=m.multiplicarMat4(modelCassiniMain,localBaseSoporte2);
    dibujarCuerpo(texturaDorado2,modelBaseSoporte2,false,mallaCilindro.numIndices);

    // Soporte Base 3
    const localBaseSoporte3=m.multiplicarMat4(
        m.matrizTraslacion4(0,-0.6,0),
        m.matrizEscala4(0.8,0.06,0.8)
    );
    const modelBaseSoporte3=m.multiplicarMat4(modelCassiniMain,localBaseSoporte3);
    dibujarCuerpo(texturaDorado2,modelBaseSoporte3,false,mallaCilindro.numIndices);

    // Antena 1
    const localAntena=m.multiplicarMat4(m.matrizTraslacion4(0,0.2,0),m.matrizEscala4(1.6,0.6,1.6));
    const modelAntena=m.multiplicarMat4(modelCassiniMain,localAntena);
    
    gl.bindVertexArray(mallaCono1.vao);
    dibujarCuerpo(texturaPlomo,modelAntena,false,mallaCono1.numIndices);

    // Anteanna Main2
    const localAntenaMain2=m.multiplicarMat4(
        m.matrizTraslacion4(0,0.9,0),
        m.matrizEscala4(0.1,0.03,0.1)
    );
    const modelAntenaMain2=m.multiplicarMat4(modelCassiniMain,localAntenaMain2);
    dibujarCuerpo(texturaPlomo,modelAntenaMain2,false,mallaCono1.numIndices);

    // Mastil
    const localMastil=m.multiplicarMat4(
        m.matrizTraslacion4(0,0.42,0),
        m.multiplicarMat4(
            m.multiplicarMat4(m.matrizRotacionY(45),m.matrizRotacionZ(45)),
            m.matrizEscala4(0.35,0.35,6)
        )
    );
    const modelMastil=m.multiplicarMat4(modelCassiniMain,localMastil);

    gl.bindVertexArray(mallaPrisma.vao);
    dibujarCuerpo(texturaDorado2,modelMastil,false,mallaPrisma.numIndices);

    // Antena 2
    const localAntena2=m.multiplicarMat4(
        m.matrizTraslacion4(0,0,1.15),
        m.multiplicarMat4(
            m.matrizRotacionX(-1.5),
            m.matrizEscala4(1,0.1,0.4)
        )   
    );
    const modelAntena2=m.multiplicarMat4(modelCassiniMain,localAntena2);

    gl.bindVertexArray(mallaCono1.vao);
    dibujarCuerpo(texturaDorado2,modelAntena2,false,mallaCono1.numIndices);

    // Soporte
    const localSoporte1=m.multiplicarMat4(
        m.matrizTraslacion4(0,-0.5,1),
        m.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte1=m.multiplicarMat4(modelCassiniMain,localSoporte1);
    gl.bindVertexArray(mallaCubo.vao);
    dibujarCuerpo(texturaPlomo,modelSoporte1,false,mallaCubo.numIndices);

    const localSoporte2=m.multiplicarMat4(
        m.matrizTraslacion4(0,-0.5,-1),
        m.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte2=m.multiplicarMat4(modelCassiniMain,localSoporte2);
    dibujarCuerpo(texturaPlomo,modelSoporte2,false,mallaCubo.numIndices);

    const localSoporte3=m.multiplicarMat4(
        m.matrizTraslacion4(1,-0.5,0),
        m.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte3=m.multiplicarMat4(modelCassiniMain,localSoporte3);
    dibujarCuerpo(texturaPlomo,modelSoporte3,false,mallaCubo.numIndices);

    const localSoporte4=m.multiplicarMat4(
        m.matrizTraslacion4(-1,-0.5,0),
        m.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte4=m.multiplicarMat4(modelCassiniMain,localSoporte4);
    dibujarCuerpo(texturaPlomo,modelSoporte4,false,mallaCubo.numIndices);

    const localSoporte5=m.multiplicarMat4(
        m.matrizTraslacion4(-0.8,0,0),
        m.matrizEscala4(1,0.6,1)
    );
    const modelSoporte5=m.multiplicarMat4(modelCassiniMain,localSoporte5);
    dibujarCuerpo(texturaDorado2,modelSoporte5,false,mallaCubo.numIndices);

    const localSoporte6=m.multiplicarMat4(
        m.matrizTraslacion4(-0.6,0.1,0),
        m.matrizEscala4(1,0.6,0.8)
    );
    const modelSoporte6=m.multiplicarMat4(modelCassiniMain,localSoporte6);
    dibujarCuerpo(texturaDorado,modelSoporte6,false,mallaCubo.numIndices);

    gl.bindVertexArray(null);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);