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


const eye=[0.0,-5.0,3.0];        
const target=[0.0,0.0,0.0];     
const up=[0.0,1.0,0.0];         

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

function dibujarCuerpo(textura,modelMatrix,emisivo,indicesLength){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,textura);

    gl.uniformMatrix4fv(modelMatrixLocation,false,modelMatrix);
    gl.uniform1i(emissiveLoc, emisivo ? 1 : 0);

    gl.drawElements(
        gl.TRIANGLES,
        indicesLength,
        gl.UNSIGNED_SHORT,
        0
    );
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
    const modelFondo = m.matrizIdentidad4();
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelFondo);

    gl.drawElements(
        gl.TRIANGLES,
        mallaFondo.numIndices,
        gl.UNSIGNED_SHORT,
        0
    );

    // Restaurar el estado de WebGL
    gl.depthMask(profundidadAnterior);

    if (cullingAnterior) {
        gl.enable(gl.CULL_FACE);
    }

    gl.bindVertexArray(null);
}


let tiempoAnterior = 0;
let giroSaturno = 0;
let giroTierra = 0;

let giroCassini=0;

function render(ms) {
    const tiempo = ms * 0.001;
    const dt = tiempo - tiempoAnterior;
    tiempoAnterior = tiempo;

    giroSaturno += 0.10 * dt;
    giroTierra += 0.45 * dt;

    giroCassini += 0.5*dt;

    gl.clear(
        gl.COLOR_BUFFER_BIT |
        gl.DEPTH_BUFFER_BIT
    );

    dibujarFondo();

    // Saturno
    //gl.bindVertexArray(mallaSaturno.vao);
    //const modelSaturno = m.multiplicarMat4(m.matrizRotacionY(giroSaturno),m.matrizEscala4(1.35, 1.35, 1.35));
    //dibujarCuerpo(texturaSaturno,modelSaturno,true,mallaSaturno.numIndices);

    // Anillo
    //gl.bindVertexArray(mallaAnillo.vao);
    //const modelAnillo=m.multiplicarMat4(modelSaturno,m.matrizRotacionX(Math.PI/2));
    //dibujarCuerpo(texturaAnillo,modelAnillo,true,mallaAnillo.numIndices);

    // Cassini

    // Cilindro principal (main)
    const modelCassiniMain=m.multiplicarMat4(m.matrizRotacionY(0),m.matrizEscala4(1,2.5,1));
    
    gl.bindVertexArray(mallaCilindro.vao);
    dibujarCuerpo(texturaDorado,modelCassiniMain,false,mallaCilindro.numIndices);

    // Antena 1
    const localAntena=m.multiplicarMat4(m.matrizTraslacion4(0,0.2,0),m.matrizEscala4(1.6,0.6,1.6));
    const modelAntena=m.multiplicarMat4(modelCassiniMain,localAntena);
    
    gl.bindVertexArray(mallaCono1.vao);
    dibujarCuerpo(texturaPlomo,modelAntena,false,mallaCono1.numIndices);

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
        m.matrizTraslacion4(0,-1.5,2.25),
        m.matrizEscala4(0.1,0.1,0.1)
    );
    const modelSoporte1=m.multiplicarMat4(modelCassiniMain,localSoporte1);
    gl.bindVertexArray(mallaCubo.vao);
    dibujarCuerpo(texturaPlomo,modelSoporte1,false,mallaCubo.numIndices);


    gl.bindVertexArray(null);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);