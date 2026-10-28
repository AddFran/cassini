export class Draw {
    static #gl;
    static #modelMatrixLocation;
    static #emissiveLoc;
    static #reflectivityLoc;

    #textura;
    #modelMatrix;
    #emisivo;
    #indicesLength;
    #mallaFondo;
    #reflectividad;

    static set Gl(newGl){ Draw.#gl=newGl; }
    static set ModMatLoc(newMML){ Draw.#modelMatrixLocation=newMML;}
    static set EmiLoc(newEmiloc){ Draw.#emissiveLoc=newEmiloc; }
    static set ReflectLoc(newLocation){ Draw.#reflectivityLoc=newLocation; }

    constructor(Textura,ModelMatrix,Emisivo,Indices,Malla,Reflectividad=0){
        this.#textura=Textura;
        this.#modelMatrix=ModelMatrix;
        this.#emisivo=Emisivo;
        this.#indicesLength=Indices;
        this.#mallaFondo=Malla;
        this.#reflectividad=Math.max(0,Math.min(1, Reflectividad));
    }

    dibujarCuerpo(){
        const gl=Draw.#gl;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.#textura);
        gl.uniformMatrix4fv(Draw.#modelMatrixLocation,false,this.#modelMatrix);
        gl.uniform1i(Draw.#emissiveLoc,this.#emisivo ? 1 : 0);
        gl.uniform1f(Draw.#reflectivityLoc,this.#reflectividad);
        gl.drawElements(gl.TRIANGLES,this.#indicesLength,gl.UNSIGNED_SHORT,0);
    }
}
