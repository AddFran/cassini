// Funcion para dibujar un cuerpo celeste
export function dibujarCuerpo(gl,textura, modelMatrix, emisivo) {
    // ¿Recuerdas lo que haciamos al final de la funcion render() en pasos anteriores?
    // Esto es exactamente lo mismo

    // Activamos la textura
    gl.activeTexture(gl.TEXTURE0);
    // Volvemos a vinvular la textura
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