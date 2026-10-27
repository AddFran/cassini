export class Draw{
    static #gl;
    static #modelMatrixLocation;
    static #emissiveLoc;
    
    #textura;
    #modelMatrix;
    #emisivo;
    #indicesLength;

    #mallaFondo;

    static set Gl(newGl){ Draw.#gl=newGl; }
    static set ModMatLoc(newMML){ Draw.#modelMatrixLocation=newMML; }
    static set EmiLoc(newEmiloc){ Draw.#emissiveLoc=newEmiloc; }

    constructor(Textura,ModelMatrix,Emisivo,Indices,Malla){
        this.#textura=Textura;
        this.#modelMatrix=ModelMatrix;
        this.#emisivo=Emisivo;
        this.#indicesLength=Indices;
        this.#mallaFondo=Malla;
    }

    dibujarCuerpo(){
        Draw.#gl.activeTexture(Draw.#gl.TEXTURE0);
        Draw.#gl.bindTexture(Draw.#gl.TEXTURE_2D,this.#textura);
        Draw.#gl.uniformMatrix4fv(Draw.#modelMatrixLocation,false,this.#modelMatrix);
        Draw.#gl.uniform1i(Draw.#emissiveLoc, this.#emisivo ? 1 : 0);
        Draw.#gl.drawElements(Draw.#gl.TRIANGLES,this.#indicesLength,Draw.#gl.UNSIGNED_SHORT,0);
    }
}   