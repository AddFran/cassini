export class Draw{
    #gl;
    #modelMatrixLocation;
    #emissiveLoc;
    
    #textura;
    #modelMatrix;
    #emisivo;
    #indicesLength;

    #mallaFondo;

    constructor(Gl,ModelMatrixLocation,EmissiveLoc,Textura,ModelMatrix,Emisivo,Indices,Malla){
        this.#gl=Gl;
        this.#modelMatrixLocation=ModelMatrixLocation;
        this.#emissiveLoc=EmissiveLoc;
        this.#textura=Textura;
        this.#modelMatrix=ModelMatrix;
        this.#emisivo=Emisivo;
        this.#indicesLength=Indices;
        this.#mallaFondo=Malla;
    }

    dibujarCuerpo(){
        this.#gl.activeTexture(this.#gl.TEXTURE0);
        this.#gl.bindTexture(this.#gl.TEXTURE_2D,this.#textura);
        this.#gl.uniformMatrix4fv(this.#modelMatrixLocation,false,this.#modelMatrix);
        this.#gl.uniform1i(this.#emissiveLoc, this.#emisivo ? 1 : 0);
        this.#gl.drawElements(this.#gl.TRIANGLES,this.#indicesLength,this.#gl.UNSIGNED_SHORT,0);
    }
}

export function dibujarCuerpo(gl,modelMatrixLocation,emissiveLoc,textura,modelMatrix,emisivo,indicesLength){
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,textura);
    gl.uniformMatrix4fv(modelMatrixLocation,false,modelMatrix);
    gl.uniform1i(emissiveLoc, emisivo ? 1 : 0);
    gl.drawElements(gl.TRIANGLES,indicesLength,gl.UNSIGNED_SHORT,0);
}

export function dibujarFondo(gl,mallaFondo,textura,emissiveLoc,modelMatrixLocation) {
    gl.bindVertexArray(mallaFondo.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    
    gl.uniform1i(textureLoc, 0);
    gl.uniform1i(emissiveLoc, 1);

    const profundidadAnterior = gl.getParameter(gl.DEPTH_WRITEMASK);
    gl.depthMask(false);

    const cullingAnterior = gl.isEnabled(gl.CULL_FACE);
    gl.disable(gl.CULL_FACE);

    const eye = obtenerEyeCamara();
    const modelFondo = m.matrizTraslacion4(eye[0],eye[1],eye[2]);
    gl.uniformMatrix4fv(modelMatrixLocation, false, modelFondo);

    gl.drawElements(gl.TRIANGLES,mallaFondo.numIndices,gl.UNSIGNED_SHORT,0);

    gl.depthMask(profundidadAnterior);

    if(cullingAnterior){
        gl.enable(gl.CULL_FACE);
    }

    gl.bindVertexArray(null);
}