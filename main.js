import {Draw} from "./js/dibujarCuerpo.js";
import {Matrix} from "./js/operacionesMatrices.js";
import {Geometry} from "./js/crearFiguras.js";
import {Mesh} from "./js/crearMalla.js";
import {Texture} from "./js/cargarTextura.js";
import {Shader} from "./js/crearShader.js";

const canvas=document.getElementById("glCanvas"); 
const gl=canvas.getContext("webgl2");

if(!gl){
    throw new Error("WebGL2 no está disponible en este navegador.");
}

gl.viewport(0,0,canvas.width,canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0); 
gl.enable(gl.DEPTH_TEST); 

const esfera=Geometry.crearEsfera(1,32,48);
const esferaFondo=Geometry.crearEsfera(100,48,96);
//const esfera=figure.crearCubo(2);
//const esfera=figure.crearCilindro(1,4,32);
//const esfera=figure.crearPrismaTriangular(2,4);
//const esfera=figure.crearCono(2,1);

const anillo=Geometry.crearAnillo(2,3,128);
const cubo=Geometry.crearCubo(1);
const cilindro=Geometry.crearCilindro(1,1,64);
const prisma=Geometry.crearPrismaTriangular(1,1);
const cono1=Geometry.crearCono(1,1,64);

const vertexShaderSource = `#version 300 es 
in vec3 aPosition; 
in vec3 aNormal;   
in vec2 aTexCoord; 

uniform mat4 uModelMatrix;      
uniform mat4 uViewMatrix;       
uniform mat4 uProjectionMatrix; 

out vec3 vNormal;   
out vec2 vTexCoord; 
out vec3 vWorldPosition;

void main() {
    vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
    vNormal = normalize(mat3(uModelMatrix) * aNormal);
    vTexCoord = aTexCoord;
    vWorldPosition = worldPosition.xyz;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec2 vTexCoord;
in vec3 vWorldPosition;

uniform sampler2D uTexture;
uniform vec3 uLightDirection;
uniform vec3 uViewPosition;
uniform bool uEmissive;
uniform float uReflectivity;

out vec4 outColor;

void main() {
    vec3 colorTextura = texture(uTexture, vTexCoord).rgb;

    // Los objetos emisivos conservan su comportamiento actual.
    if (uEmissive) {
        outColor = vec4(colorTextura, 1.0);
        return;
    }

    vec3 N = normalize(vNormal);
    vec3 L = normalize(-uLightDirection);

    // Iluminación original: no modificar.
    float diffuse = max(dot(N, L), 0.0);
    float ambiente = 0.15;
    vec3 colorFinal = colorTextura * (ambiente + diffuse);

    // Reflejo especular metálico.
    if (uReflectivity > 0.0) {
        vec3 V = normalize(uViewPosition - vWorldPosition);
        vec3 R = reflect(-L, N);

        float specular = pow(max(dot(R, V), 0.0), 64.0);

        // El reflejo adquiere el color del material metálico.
        vec3 colorEspecular = colorTextura * specular;

        colorFinal += colorEspecular * uReflectivity * 1.5;
    }

    outColor = vec4(colorFinal, 1.0);
}
`;

const vertexShader=Shader.crearShader(gl,gl.VERTEX_SHADER,vertexShaderSource);
const fragmentShader=Shader.crearShader(gl,gl.FRAGMENT_SHADER,fragmentShaderSource);

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

const mallaSaturno=Mesh.crearMalla(gl,program,esfera);
const mallaAnillo=Mesh.crearMalla(gl,program,anillo);
const mallaFondo=Mesh.crearMalla(gl,program,esferaFondo);

const mallaCilindro=Mesh.crearMalla(gl,program,cilindro);
const mallaCono1=Mesh.crearMalla(gl,program,cono1);
const mallaPrisma=Mesh.crearMalla(gl,program,prisma);
const mallaCubo=Mesh.crearMalla(gl,program,cubo);

const texturaSol=Texture.cargarTextura(gl,"texture/sol.jpg");
const texturaSaturno=Texture.cargarTextura(gl,"texture/saturno.jpg",gl.REPEAT,gl.REPEAT);
const texturaAnillo=Texture.cargarTextura(gl,"texture/anillo_saturno.png",gl.CLAMP_TO_EDGE,gl.REPEAT);
const texturaFondo=Texture.cargarTextura(gl,"texture/fondo_universo.jpg",gl.CLAMP_TO_EDGE,gl.REPEAT);
const texturaDorado=Texture.cargarTextura(gl,"texture/amarilloOroTextura.png",gl.REPEAT,gl.REPEAT);
const texturaDorado2=Texture.cargarTextura(gl,"texture/cassiniDorado2.jpg",gl.REPEAT,gl.REPEAT);
const texturaPlomo=Texture.cargarTextura(gl,"texture/cassiniEstandar.jpg",gl.REPEAT,gl.REPEAT);


const modelMatrixLocation=gl.getUniformLocation(program,"uModelMatrix");
const viewMatrixLocation=gl.getUniformLocation(program,"uViewMatrix");
const projectionMatrixLocation=gl.getUniformLocation(program,"uProjectionMatrix");
const lightDirectionLocation=gl.getUniformLocation(program,"uLightDirection");
const textureLoc=gl.getUniformLocation(program,"uTexture");
const emissiveLoc=gl.getUniformLocation(program,"uEmissive");
const reflectivityLoc=gl.getUniformLocation(program, "uReflectivity");
const viewPositionLoc=gl.getUniformLocation(program, "uViewPosition");


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
    return Matrix.matrizLookAt(eye,camera.target,[0.0,1.0,0.0]);
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

    camera.elevacion=limitar(camera.elevacion,-limiteVertical,limiteVertical);
});
canvas.addEventListener("wheel", (evento) => {
    evento.preventDefault();
    camera.distancia+=evento.deltaY*camera.sensibilidadZoom;
    camera.distancia=limitar(camera.distancia,camera.distanciaMin,camera.distanciaMax);
}, { passive: false });

const fovGrados=60;                           
const fovRadianes=fovGrados*Math.PI/180;  
const aspect=canvas.width/canvas.height;    

const near=0.1;  
const far=100000.0; 


const projectionMatrix = Matrix.matrizPerspectiva(fovRadianes,aspect,near,far);
gl.useProgram(program);
gl.uniformMatrix4fv(projectionMatrixLocation,false,projectionMatrix);

const lightDirection = Matrix.normalizarVec3([-1.0, -0.5, -1.0]);
gl.uniform3fv(lightDirectionLocation, lightDirection);

gl.uniform1i(textureLoc,0);

function dibujarFondo(){
    gl.bindVertexArray(mallaFondo.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturaFondo);
    gl.uniform1i(textureLoc, 0);
    gl.uniform1i(emissiveLoc, 1);

    const profundidadAnterior = gl.getParameter(gl.DEPTH_WRITEMASK);
    gl.depthMask(false);

    const cullingAnterior = gl.isEnabled(gl.CULL_FACE);
    gl.disable(gl.CULL_FACE);

    const eye = obtenerEyeCamara();
    const modelFondo = Matrix.matrizTraslacion4(eye[0],eye[1],eye[2]);
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelFondo);
    gl.drawElements(gl.TRIANGLES,mallaFondo.numIndices,gl.UNSIGNED_SHORT,0);
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

    giroCassini+=0.05*dt;

    gl.clear(
        gl.COLOR_BUFFER_BIT |
        gl.DEPTH_BUFFER_BIT
    );

    Draw.Gl = gl;
    Draw.ModMatLoc = modelMatrixLocation;
    Draw.EmiLoc = emissiveLoc;
    Draw.ReflectLoc = reflectivityLoc;

    // Actualizar la cámara según el mouse
    const viewMatrix=obtenerViewCamara();
    gl.useProgram(program);
    gl.uniformMatrix4fv(viewMatrixLocation,false,viewMatrix);

    const eye = obtenerEyeCamara();
    gl.uniform3fv(viewPositionLoc,eye);

    dibujarFondo();

    // Saturno
    const modelSaturno=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(-10,-20,-50000),
        Matrix.multiplicarMat4(
            Matrix.multiplicarMat4(
                Matrix.multiplicarMat4(Matrix.matrizRotacionZ(-0.1),Matrix.matrizRotacionX(0.1)),
                Matrix.matrizRotacionY(giroSaturno)
            ),
            Matrix.matrizEscala4(10000,10000,10000)
        )
    );
    gl.bindVertexArray(mallaSaturno.vao);
    const saturnoDraw=new Draw(texturaSaturno,modelSaturno,false,mallaSaturno.numIndices,null);
    saturnoDraw.dibujarCuerpo();
    //dibujarCuerpo(texturaSaturno,modelSaturno,false,mallaSaturno.numIndices);

    // Anillo
    const modelAnillo=Matrix.multiplicarMat4(
        modelSaturno,
        Matrix.matrizRotacionX(Math.PI/2)
    );
    gl.bindVertexArray(mallaAnillo.vao);
    const anilloDraw=new Draw(texturaAnillo,modelAnillo,true,mallaAnillo.numIndices,null);
    anilloDraw.dibujarCuerpo();



    // CASSINI CILINDROS //

    // Cilindro principal (main)
    const modelCassiniMain=Matrix.multiplicarMat4(
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionX(-0.95),
            Matrix.multiplicarMat4(
                Matrix.matrizRotacionY(giroCassini),
                Matrix.matrizRotacionZ(-0.3)
            )
        ),
        Matrix.matrizEscala4(1,2.5,1)
    );
    
    gl.bindVertexArray(mallaCilindro.vao);
    const cassiniCuerpoMain=new Draw(texturaDorado2,modelCassiniMain,false,mallaCilindro.numIndices,null,0.8);
    cassiniCuerpoMain.dibujarCuerpo()

    // Antena Main
    const localAntenaMain=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.4,0),
        Matrix.matrizEscala4(0.05,1,0.05)
    );
    const modelAntenaMain=Matrix.multiplicarMat4(modelCassiniMain,localAntenaMain);
    const antenaMain=new Draw(texturaPlomo,modelAntenaMain,false,mallaCilindro.numIndices,null,0.8);
    antenaMain.dibujarCuerpo();

    // Antena Main1
    const localAntenaMain1=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.88,0),
        Matrix.matrizEscala4(0.1,0.03,0.1)
    );
    const modelAntenaMain1=Matrix.multiplicarMat4(modelCassiniMain,localAntenaMain1);
    const antenaMain1=new Draw(texturaPlomo,modelAntenaMain1,false,mallaCilindro.numIndices,null,0.8);
    antenaMain1.dibujarCuerpo();

    // Base Antena Main
    const localBaseAntenaMain=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.52,0),
        Matrix.matrizEscala4(0.88,0.02,0.88)
    );
    const modelBaseAntenaMain=Matrix.multiplicarMat4(modelCassiniMain,localBaseAntenaMain);
    const baseAntenaMain=new Draw(texturaPlomo,modelBaseAntenaMain,false,mallaCilindro.numIndices,null,0.8);
    baseAntenaMain.dibujarCuerpo();

    // Soporte Base
    const localBaseSoporte=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.55,0),
        Matrix.matrizEscala4(0.6,0.1,0.6)
    );
    const modelBaseSoporte=Matrix.multiplicarMat4(modelCassiniMain,localBaseSoporte);
    const soporteBase=new Draw(texturaPlomo,modelBaseSoporte,false,mallaCilindro.numIndices,null,0.8);
    soporteBase.dibujarCuerpo();

    // Soporte Base 2
    const localBaseSoporte2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.5,0),
        Matrix.matrizEscala4(0.7,0.08,0.7)
    );
    const modelBaseSoporte2=Matrix.multiplicarMat4(modelCassiniMain,localBaseSoporte2);
    const soporteBase2=new Draw(texturaDorado2,modelBaseSoporte2,false,mallaCilindro.numIndices,null,0.8);
    soporteBase2.dibujarCuerpo();

    // Soporte Base 3
    const localBaseSoporte3=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.6,0),
        Matrix.matrizEscala4(0.8,0.06,0.8)
    );
    const modelBaseSoporte3=Matrix.multiplicarMat4(modelCassiniMain,localBaseSoporte3);
    const soporteBase3=new Draw(texturaDorado2,modelBaseSoporte3,false,mallaCilindro.numIndices,null,0.8);
    soporteBase3.dibujarCuerpo();

    // Soporte Base 4
    const localBaseSoporte4=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0.8,0.22,0.48),
        Matrix.matrizEscala4(0.3,0.6,0.3)
    );
    const modelBaseSoporte4=Matrix.multiplicarMat4(modelCassiniMain,localBaseSoporte4);
    const soporteBase4=new Draw(texturaDorado2,modelBaseSoporte4,false,mallaCilindro.numIndices,null,0.8);
    soporteBase4.dibujarCuerpo();

    // Soporte Base 5
    const localBaseSoporte5=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0,-1),
        Matrix.matrizEscala4(0.3,0.6,0.3)
    );
    const modelBaseSoporte5=Matrix.multiplicarMat4(modelCassiniMain,localBaseSoporte5);
    const soporteBase5=new Draw(texturaPlomo,modelBaseSoporte5,false,mallaCilindro.numIndices,null,0.8);
    soporteBase5.dibujarCuerpo();

    // Soporte Base 6
    const localBaseSoporte6=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.42,0),
        Matrix.multiplicarMat4(
            Matrix.multiplicarMat4(
                Matrix.matrizRotacionZ(1.55),
                Matrix.matrizRotacionX(0.8)
            ),
            Matrix.matrizEscala4(0.05,3,0.1)
        )
    );
    const modelBaseSoporte6=Matrix.multiplicarMat4(modelCassiniMain,localBaseSoporte6);
    const soporteBase6=new Draw(texturaPlomo,modelBaseSoporte6,false,mallaCilindro.numIndices,null,0.8);
    soporteBase6.dibujarCuerpo();

    // Soporte Base 6
    const localEquipo3=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0.9,0,-0.45),    
        Matrix.matrizEscala4(0.05,0.3,0.1)
        
    );
    const modelEquipo3=Matrix.multiplicarMat4(modelCassiniMain,localEquipo3);
    const soporteEquipo3=new Draw(texturaPlomo,modelEquipo3,false,mallaCilindro.numIndices,null,0.8);
    soporteEquipo3.dibujarCuerpo();



    // CONOS //

    // Antena 1
    const localAntena=Matrix.multiplicarMat4(Matrix.matrizTraslacion4(0,0.2,0),Matrix.matrizEscala4(1.6,0.6,1.6));
    const modelAntena=Matrix.multiplicarMat4(modelCassiniMain,localAntena);
    
    gl.bindVertexArray(mallaCono1.vao);
    const antena1=new Draw(texturaPlomo,modelAntena,false,mallaCono1.numIndices,null,0.8);
    antena1.dibujarCuerpo();

    // Anteanna Main2
    const localAntenaMain2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.9,0),
        Matrix.matrizEscala4(0.1,0.03,0.1)
    );
    const modelAntenaMain2=Matrix.multiplicarMat4(modelCassiniMain,localAntenaMain2);
    const antenaMain2=new Draw(texturaPlomo,modelAntenaMain2,false,mallaCono1.numIndices,null,0.8);
    antenaMain2.dibujarCuerpo();

    // Anteanna Main3
    const localAntenaMain3=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.7,0),
        Matrix.matrizEscala4(0.5,0.07,0.5)
    );
    const modelAntenaMain3=Matrix.multiplicarMat4(modelCassiniMain,localAntenaMain3);
    const antenaMain3=new Draw(texturaPlomo,modelAntenaMain3,false,mallaCono1.numIndices,null,0.8);
    antenaMain3.dibujarCuerpo();

    // Propulsor1
    const localPropulsor1=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0.2,-0.64,0),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionX(3.25),
            Matrix.matrizEscala4(0.1,0.1,0.1)
        )
    );
    const modelPropulsor1=Matrix.multiplicarMat4(modelCassiniMain,localPropulsor1);
    const antenaPropulsor1=new Draw(texturaPlomo,modelPropulsor1,false,mallaCono1.numIndices,null,0.8);
    antenaPropulsor1.dibujarCuerpo();

    // Propulsor2
    const localPropulsor2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(-0.2,-0.64,0),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionX(3.25),
            Matrix.matrizEscala4(0.1,0.1,0.1)
        )
    );
    const modelPropulsor2=Matrix.multiplicarMat4(modelCassiniMain,localPropulsor2);
    const antenaPropulsor2=new Draw(texturaPlomo,modelPropulsor2,false,mallaCono1.numIndices,null,0.8);
    antenaPropulsor2.dibujarCuerpo();



    // PRISMA TRIANGULAR //

    // Mastil
    const localMastil=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.42,0),
        Matrix.multiplicarMat4(
            Matrix.multiplicarMat4(Matrix.matrizRotacionY(45),Matrix.matrizRotacionZ(45)),
            Matrix.matrizEscala4(0.35,0.35,4)
        )
    );
    const modelMastil=Matrix.multiplicarMat4(modelCassiniMain,localMastil);

    gl.bindVertexArray(mallaPrisma.vao);
    const mastil=new Draw(texturaDorado2,modelMastil,false,mallaPrisma.numIndices,null,0.8);
    mastil.dibujarCuerpo();

    const localMastil2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.42,0),
        Matrix.multiplicarMat4(
            Matrix.multiplicarMat4(Matrix.matrizRotacionY(45),Matrix.matrizRotacionZ(45)),
            Matrix.matrizEscala4(0.2,0.2,7.8)
        )
    );
    const modelMastil2=Matrix.multiplicarMat4(modelCassiniMain,localMastil2);
    const mastil2=new Draw(texturaPlomo,modelMastil2,false,mallaPrisma.numIndices,null,0.8);
    mastil2.dibujarCuerpo();

    const localMastil3=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(4,0.42,2.5),
        Matrix.multiplicarMat4(
            Matrix.multiplicarMat4(Matrix.matrizRotacionY(45),Matrix.matrizRotacionZ(45)),
            Matrix.matrizEscala4(0.35,0.35,3)
        )
    );
    const modelMastil3=Matrix.multiplicarMat4(modelCassiniMain,localMastil3);
    const mastil3=new Draw(texturaDorado2,modelMastil3,false,mallaPrisma.numIndices,null,0.8);
    mastil3.dibujarCuerpo();



    // CONO OTRA VEZ //

    // Antena 2
    const localAntena2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0,1.5),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionX(-1.5),
            Matrix.matrizEscala4(1,0.4,0.4)
        )   
    );
    const modelAntena2=Matrix.multiplicarMat4(modelCassiniMain,localAntena2);

    gl.bindVertexArray(mallaCono1.vao);
    const antena2=new Draw(texturaDorado2,modelAntena2,false,mallaCono1.numIndices,null,0.8);
    antena2.dibujarCuerpo(texturaDorado2,modelAntena2,false,mallaCono1.numIndices);





    // CUBOS //

    // Soporte
    const localSoporte1=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.5,1),
        Matrix.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte1=Matrix.multiplicarMat4(modelCassiniMain,localSoporte1);
    gl.bindVertexArray(mallaCubo.vao);
    const soporte=new Draw(texturaPlomo,modelSoporte1,false,mallaCubo.numIndices,null,0.8);
    soporte.dibujarCuerpo();

    const localSoporte2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.5,-1),
        Matrix.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte2=Matrix.multiplicarMat4(modelCassiniMain,localSoporte2);
    const soporte2=new Draw(texturaPlomo,modelSoporte2,false,mallaCubo.numIndices,null,0.8);
    soporte2.dibujarCuerpo();

    const localSoporte3=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(1,-0.5,0),
        Matrix.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte3=Matrix.multiplicarMat4(modelCassiniMain,localSoporte3);
    const soporte3=new Draw(texturaPlomo,modelSoporte3,false,mallaCubo.numIndices,null,0.8);
    soporte3.dibujarCuerpo();

    const localSoporte4=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(-1,-0.5,0),
        Matrix.matrizEscala4(0.1,0.5,0.1)
    );
    const modelSoporte4=Matrix.multiplicarMat4(modelCassiniMain,localSoporte4);
    const soporte4=new Draw(texturaPlomo,modelSoporte4,false,mallaCubo.numIndices,null,0.8);
    soporte4.dibujarCuerpo();

    const localSoporte5=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(-0.8,0,0),
        Matrix.matrizEscala4(1,0.6,1)
    );
    const modelSoporte5=Matrix.multiplicarMat4(modelCassiniMain,localSoporte5);
    const soporte5=new Draw(texturaDorado2,modelSoporte5,false,mallaCubo.numIndices,null,0.8);
    soporte5.dibujarCuerpo();

    const localSoporte6=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(-0.6,0.1,0),
        Matrix.matrizEscala4(1,0.6,0.8)
    );
    const modelSoporte6=Matrix.multiplicarMat4(modelCassiniMain,localSoporte6);
    const soporte6=new Draw(texturaDorado,modelSoporte6,false,mallaCubo.numIndices,null,0.8);
    soporte6.dibujarCuerpo();

    const localEquipo1=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(-0.5,0.12,0.5),
        Matrix.matrizEscala4(1,0.2,0.8)
    );
    const modelEquipo1=Matrix.multiplicarMat4(modelCassiniMain,localEquipo1);
    const equipo1=new Draw(texturaPlomo,modelEquipo1,false,mallaCubo.numIndices,null,0.8);
    equipo1.dibujarCuerpo();

    const localEquipo2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.12,-1),
        Matrix.matrizEscala4(0.6,0.4,0.6)
    );
    const modelEquipo2=Matrix.multiplicarMat4(modelCassiniMain,localEquipo2);
    const equipo2=new Draw(texturaPlomo,modelEquipo2,false,mallaCubo.numIndices,null,0.8);
    equipo2.dibujarCuerpo();

    const localSoporte7=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.4,0),
        Matrix.matrizEscala4(3.5,0.1,0.1)
    );
    const modelSoporte7=Matrix.multiplicarMat4(modelCassiniMain,localSoporte7);
    const soporte7=new Draw(texturaDorado2,modelSoporte7,false,mallaCubo.numIndices,null,0.8);
    soporte7.dibujarCuerpo();

    const localSoporte8=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,-0.4,0),
        Matrix.matrizEscala4(0.1,0.1,3.5)
    );
    const modelSoporte8=Matrix.multiplicarMat4(modelCassiniMain,localSoporte8);
    const soporte8=new Draw(texturaDorado2,modelSoporte8,false,mallaCubo.numIndices,null,0.8);
    soporte8.dibujarCuerpo();

    // Paneles superiores
    const localPanel1=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.4,0),
        Matrix.matrizEscala4(0.2,0.1,2)
    );
    const modelPanel1=Matrix.multiplicarMat4(modelCassiniMain,localPanel1);
    const panel1=new Draw(texturaPlomo,modelPanel1,false,mallaCubo.numIndices,null,0.8);
    panel1.dibujarCuerpo();

    const localPanel2=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.4,0),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionY(0.5),
            Matrix.matrizEscala4(0.2,0.1,2)
        )
    );
    const modelPanel2=Matrix.multiplicarMat4(modelCassiniMain,localPanel2);
    const panel2=new Draw(texturaPlomo,modelPanel2,false,mallaCubo.numIndices,null,0.8);
    panel2.dibujarCuerpo();

    const localPanel3=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.4,0),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionY(1),
            Matrix.matrizEscala4(0.2,0.1,2)
        )
    );
    const modelPanel3=Matrix.multiplicarMat4(modelCassiniMain,localPanel3);
    const panel3=new Draw(texturaPlomo,modelPanel3,false,mallaCubo.numIndices,null,0.8);
    panel3.dibujarCuerpo();

    const localPanel4=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.4,0),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionY(-0.5),
            Matrix.matrizEscala4(0.2,0.1,2)
        )
    );
    const modelPanel4=Matrix.multiplicarMat4(modelCassiniMain,localPanel4);
    const panel4=new Draw(texturaPlomo,modelPanel4,false,mallaCubo.numIndices,null,0.8);
    panel4.dibujarCuerpo();

    const localPanel5=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.4,0),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionY(-1),
            Matrix.matrizEscala4(0.2,0.1,2)
        )
    );
    const modelPanel5=Matrix.multiplicarMat4(modelCassiniMain,localPanel5);
    const panel5=new Draw(texturaPlomo,modelPanel5,false,mallaCubo.numIndices,null,0.8);
    panel5.dibujarCuerpo();

    const localPanel6=Matrix.multiplicarMat4(
        Matrix.matrizTraslacion4(0,0.4,0),
        Matrix.multiplicarMat4(
            Matrix.matrizRotacionY(-1.5),
            Matrix.matrizEscala4(0.2,0.1,2)
        )
    );
    const modelPanel6=Matrix.multiplicarMat4(modelCassiniMain,localPanel6);
    const panel6=new Draw(texturaPlomo,modelPanel6,false,mallaCubo.numIndices,null,0.8);
    panel6.dibujarCuerpo();

    gl.bindVertexArray(null);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);