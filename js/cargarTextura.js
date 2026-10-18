export function cargarTextura(gl,url){ 
    const textura=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
        
    gl.texImage2D(
        gl.TEXTURE_2D,0,
        gl.RGBA,1,1,0,
        gl.RGBA,gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255])
    );

    const imagen=new Image();   

    imagen.onload = () => { 
        gl.bindTexture(gl.TEXTURE_2D, textura);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            gl.RGBA, gl.UNSIGNED_BYTE,
            imagen
        );

        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        );

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MAG_FILTER,
            gl.LINEAR
        );

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_WRAP_S,
            gl.REPEAT
        );

        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_WRAP_T,
            gl.CLAMP_TO_EDGE
        );
    };

    imagen.src = url;
    return textura;
}