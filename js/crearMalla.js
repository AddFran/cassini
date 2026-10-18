export function crearMalla(gl,program,geometria){
    const stride=8*Float32Array.BYTES_PER_ELEMENT;

    // Crear y vincular VAO
    const vao=gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Buffer de Vértices
    const vertexBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,geometria.vertices,gl.STATIC_DRAW);

    // Configurar Atributos
    const positionLocation=gl.getAttribLocation(program,"aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation,3,gl.FLOAT,false,stride,0);

    const normalLocation=gl.getAttribLocation(program,"aNormal");
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation,3,gl.FLOAT,false,stride,3*Float32Array.BYTES_PER_ELEMENT);

    const texCoordLocation=gl.getAttribLocation(program,"aTexCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation,2,gl.FLOAT,false,stride,6*Float32Array.BYTES_PER_ELEMENT);

    // Buffer de Índices
    const indexBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geometria.indices,gl.STATIC_DRAW);

    // Desvincular
    gl.bindVertexArray(null);

    // Retornamos un objeto con el VAO y la cantidad de índices (necesaria para el drawElements)
    return {
        vao: vao,
        numIndices: geometria.indices.length
    };
}