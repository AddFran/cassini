export class Texture{
    static cargarTextura(gl,url,wrapS,wrapT){ 
        const textura=gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textura);
            
        // Pixel temporal mientras carga la imagen
        gl.texImage2D(
            gl.TEXTURE_2D, 0,
            gl.RGBA, 1, 1, 0,
            gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255])
        );

        const imagen = new Image();  

        imagen.onload = () => { 
            gl.bindTexture(gl.TEXTURE_2D, textura);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE,
                imagen
            );

            gl.generateMipmap(gl.TEXTURE_2D);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Usamos los parámetros dinámicos que le pasemos a la función
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
        };

        imagen.src = url;
        return textura;
    }
}