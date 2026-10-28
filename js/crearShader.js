export class Shader{
    static crearShader(gl,tipo,codigoFuente){
        const shader=gl.createShader(tipo);   
        gl.shaderSource(shader,codigoFuente);  
        gl.compileShader(shader);               
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
            const error=gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Error al compilar shader:\n"+error);
        }
        return shader;
    }
}