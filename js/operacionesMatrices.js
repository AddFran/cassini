export class Matrix{
    static restarVec3(a,b){
        return [
            a[0]-b[0],
            a[1]-b[1],
            a[2]-b[2]
        ];
    }

    static longitudVec3(v){
        return Math.hypot(v[0],v[1],v[2]);
    }

    static normalizarVec3(v){
        const longitud=Matrix.longitudVec3(v);
        return [
            v[0]/longitud,
            v[1]/longitud,
            v[2]/longitud
        ];
    }

    static normalizar(v){
        const l=Math.hypot(v[0],v[1],v[2]);
        return [v[0]/l,v[1]/l,v[2]/l];
    }

    static productoCruz(a,b){
        return [
            a[1]*b[2]-a[2]*b[1],
            a[2]*b[0]-a[0]*b[2],
            a[0]*b[1]-a[1]*b[0]
        ];
    }

    static transformarPunto(m,p){
        const x=p[0];
        const y=p[1];
        const z=p[2];

        return [
            m[0]*x+m[4]*y+m[8]*z+m[12],
            m[1]*x+m[5]*y+m[9]*z+m[13],
            m[2]*x+m[6]*y+m[10]*z+m[14]
        ];
    }

    static transformarNormal(m,n){
        const x=n[0];
        const y=n[1];
        const z=n[2];

        return Matrix.normalizarVec3([
            m[0]*x+m[4]*y+m[8]*z,
            m[1]*x+m[5]*y+m[9]*z,
            m[2]*x+m[6]*y+m[10]*z
        ]);
    }

    static matrizIdentidad4() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static matrizTraslacion4(tx,ty,tz){
        return new Float32Array([
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            tx, ty, tz, 1
        ]);
    }

    static matrizEscala4(sx,sy,sz){
        return new Float32Array([
            sx, 0,  0,  0,
            0,  sy, 0,  0,
            0,  0,  sz, 0,
            0,  0,  0,  1
        ]);
    }

    static matrizRotacionX(angulo){
        const c = Math.cos(angulo);
        const s = Math.sin(angulo);
        return new Float32Array([
            1, 0,  0, 0,
            0, c,  s, 0,
            0, -s, c, 0,
            0, 0,  0, 1
        ]);
    }

    static matrizRotacionY(angulo){
        const c = Math.cos(angulo);
        const s = Math.sin(angulo);

        return new Float32Array([
            c, 0, -s, 0,
            0, 1,  0, 0,
            s, 0,  c, 0,
            0, 0,  0, 1
        ]);
    }

    static matrizRotacionZ(angulo){

        const c=Math.cos(angulo);
        const s=Math.sin(angulo);

        return new Float32Array([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static multiplicarMat4(a,b){
        const resultado=new Float32Array(16);
        for(let columna=0;columna<4;columna++){
            for(let fila=0;fila<4;fila++){
                let suma=0;
                for(let k=0;k<4;k++){
                    suma+=a[k*4+fila]*b[columna*4+k];
                }
                resultado[columna*4+fila]=suma;
            }
        }
        return resultado;
    }

    static matrizPerspectiva(fovRadianes,aspect,near,far){
        const f=1.0/Math.tan(fovRadianes/2);
        const nf=1/(near-far);

        return new Float32Array([
            f/aspect, 0, 0, 0,            
            0, f, 0, 0,                     
            0, 0, (far+near)*nf, -1,                      
            0, 0, (2*far*near)*nf, 0  
        ]);
    }

    static matrizLookAt(eye,target,up){
        const zAxis=Matrix.normalizarVec3(Matrix.restarVec3(eye,target));
        const xAxis=Matrix.normalizarVec3(Matrix.productoCruz(up,zAxis));
        const yAxis=Matrix.productoCruz(zAxis,xAxis);

        return new Float32Array([
            xAxis[0],
            yAxis[0],
            zAxis[0],
            0,

            xAxis[1],
            yAxis[1],
            zAxis[1],
            0,

            xAxis[2],
            yAxis[2],
            zAxis[2],
            0,

            -(
                xAxis[0]*eye[0]+
                xAxis[1]*eye[1]+
                xAxis[2]*eye[2]
            ),

            -(
                yAxis[0]*eye[0]+
                yAxis[1]*eye[1]+
                yAxis[2]*eye[2]
            ),

            -(
                zAxis[0]*eye[0]+
                zAxis[1]*eye[1]+
                zAxis[2]*eye[2]
            ),

            1
        ]);
    }

}