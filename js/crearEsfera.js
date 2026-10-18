export function crearEsfera(radio,segmentosLatitud,segmentosLongitud){
    const vertices = [];
    const indices = []; 

    for (let latitud=0;latitud<=segmentosLatitud;latitud++){
        const v=latitud/segmentosLatitud;
        const phi=v*Math.PI;
        for (let longitud=0;longitud<=segmentosLongitud;longitud++) {
            const u=longitud/segmentosLongitud;
            const theta=u*Math.PI*2;         

            const nx=Math.sin(phi)*Math.cos(theta);
            const ny=Math.cos(phi);
            const nz=Math.sin(phi)*Math.sin(theta);

            const x=radio*Math.sin(phi)*Math.cos(theta);
            const y=radio*Math.cos(phi);
            const z=radio*Math.sin(phi)*Math.sin(theta);

            vertices.push(x,y,z);
            vertices.push(nx,ny,nz);
            vertices.push(u,1.0-v);
        }
    }

    const columnas=segmentosLongitud+1;

    for(let latitud=0;latitud<segmentosLatitud;latitud++){
        for(let longitud=0;longitud<segmentosLongitud;longitud++){
            const actual=latitud*columnas+longitud;
            const siguiente=actual+columnas;
            indices.push(actual,siguiente,actual+1);
            indices.push(siguiente,siguiente+1,actual+1);
        }
    }

    return{
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}