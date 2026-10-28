import { Matrix } from "./operacionesMatrices.js";

export class Geometry{
    static crearCubo(tamano){
        const vertices=[];
        const indices=[];
        const h=tamano/2;

        const cara=[
            [-h,-h,h,0,0],
            [h,-h,h,1,0],
            [h,h,h,1,1],
            [-h,h,h,0,1]
        ];

        const normalInicial=[0,0,1];

        const rotaciones=[
            Matrix.matrizIdentidad4(),
            Matrix.matrizRotacionY(Math.PI),
            Matrix.matrizRotacionY(Math.PI/2),
            Matrix.matrizRotacionY(-Math.PI/2),
            Matrix.matrizRotacionX(-Math.PI/2),
            Matrix.matrizRotacionX(Math.PI/2)
        ];

        for(const rotacion of rotaciones){
            const base=vertices.length/8;

            for(const v of cara){
                const posicion=Matrix.transformarPunto(
                    rotacion,
                    [v[0], v[1], v[2]]
                );

                const normal=Matrix.transformarNormal(
                    rotacion,
                    normalInicial
                );

                vertices.push(
                    posicion[0],
                    posicion[1],
                    posicion[2],
                    normal[0],
                    normal[1],
                    normal[2],
                    v[3],
                    v[4]
                );
            }

            indices.push(
                base,base+1,base+2,
                base,base+2,base+3
            );
        }

        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }

    static crearEsfera(radio,segmentosLatitud,segmentosLongitud){
        const vertices=[];
        const indices=[]; 

        for (let latitud=0;latitud<=segmentosLatitud;latitud++){
            const v=latitud/segmentosLatitud;
            const phi=v*Math.PI;
            for (let longitud=0;longitud<=segmentosLongitud;longitud++){
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


    static crearCilindro(radio,altura,segmentos){
        const vertices=[];
        const indices=[];
        const mitadAltura=altura/2;

        for(let i=0;i<=segmentos;i++){
            const u=i/segmentos;
            const theta=u*Math.PI*2;

            const x=radio*Math.cos(theta);
            const z=radio*Math.sin(theta);
            const nx=Math.cos(theta);
            const nz=Math.sin(theta);

            vertices.push(
                x,-mitadAltura,z,
                nx,0,nz,
                u,0
            );

            vertices.push(
                x,mitadAltura,z,
                nx,0,nz,
                u,1
            );
        }

        for(let i=0;i<segmentos;i++){
            const actual=i*2;
            const siguiente=actual+2;

            indices.push(
                actual,actual+1,siguiente,
                actual+1,siguiente+1,siguiente
            );
        }

        const centroInferior=vertices.length/8;

        vertices.push(
            0,-mitadAltura,0,
            0,-1,0,
            0.5,0.5
        );

        const centroSuperior=vertices.length/8;

        vertices.push(
            0,mitadAltura,0,
            0,1,0,
            0.5,0.5
        );

        for(let i=0;i<segmentos;i++){
            const theta1=(i/segmentos)*Math.PI*2;
            const theta2=((i+1)/segmentos)*Math.PI*2;

            const x1=radio*Math.cos(theta1);
            const z1=radio*Math.sin(theta1);
            const x2=radio*Math.cos(theta2);
            const z2=radio*Math.sin(theta2);

            const base=vertices.length/8;

            vertices.push(
                x1,-mitadAltura,z1,
                0,-1,0,
                0.5+x1/(2*radio),
                0.5+z1/(2*radio)
            );

            vertices.push(
                x2,-mitadAltura,z2,
                0,-1,0,
                0.5+x2/(2*radio),
                0.5+z2/(2*radio)
            );

            indices.push(centroInferior,base+1,base);
            const baseSuperior=vertices.length/8;

            vertices.push(
                x1,mitadAltura,z1,
                0,1,0,
                0.5+x1/(2*radio),
                0.5+z1/(2*radio)
            );

            vertices.push(
                x2,mitadAltura,z2,
                0,1,0,
                0.5+x2/(2*radio),
                0.5+z2/(2*radio)
            );

            indices.push(centroSuperior,baseSuperior,baseSuperior+1);
        }

        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }


    static crearPrismaTriangular(tamano,longitud){
        const vertices=[];
        const indices=[];

        const h=tamano/2;
        const altura=(Math.sqrt(3)/2)*tamano;

        const cara=[
            [-h, -altura / 3, 0, 0, 0],
            [ h, -altura / 3, 0, 1, 0],
            [ 0,  2 * altura / 3, 0, 0.5, 1]
        ];

        const desplazamiento=Matrix.matrizTraslacion4(0,0,longitud);
        const baseInicial=cara.map(v=>[v[0],v[1],v[2]]);

        const baseFinal=cara.map(v=>
            Matrix.transformarPunto(
                desplazamiento,
                [v[0],v[1],v[2]]
            )
        );

        function agregarCara(puntos,coordenadasUV){
            const base=vertices.length/8;
            const arista1=Matrix.restarVec3(puntos[1],puntos[0]);
            const arista2=Matrix.restarVec3(puntos[2],puntos[0]);
            const normal=Matrix.normalizarVec3(Matrix.productoCruz(arista1, arista2));

            for(let i=0;i<puntos.length;i++){
                vertices.push(
                    puntos[i][0],
                    puntos[i][1],
                    puntos[i][2],
                    normal[0],
                    normal[1],
                    normal[2],
                    coordenadasUV[i][0],
                    coordenadasUV[i][1]
                );
            }

            if(puntos.length===3){
                indices.push(base,base+1,base+2);
            }else{
                indices.push(base,base+1,base+2,base,base+2,base+3);
            }
        }

        const uvTriangulo=[
            [0,0],
            [1,0],
            [0.5,1]
        ];

        agregarCara(
            [baseInicial[0],baseInicial[2],baseInicial[1]],
            [uvTriangulo[0],uvTriangulo[2],uvTriangulo[1]]
        );

        agregarCara(baseFinal,uvTriangulo);

        for(let i=0;i<3;i++){
            const siguiente=(i+1)%3;
            const puntos=[
                baseInicial[i],
                baseInicial[siguiente],
                baseFinal[siguiente],
                baseFinal[i]
            ];
            const uvRectangulo=[
                [0,0],
                [1,0],
                [1,1],
                [0,1]
            ];
            agregarCara(puntos, uvRectangulo);
        }
        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }

    static crearAnillo(radioInterior,radioExterior,segmentos){
        const vertices=[];
        const indices=[];

        for (let i=0;i<=segmentos;i++){
            const angulo=(i/segmentos)*Math.PI*2;
            const cos=Math.cos(angulo);
            const sin=Math.sin(angulo);
            const xInterior=radioInterior*cos;
            const yInterior=radioInterior*sin;
            const xExterior=radioExterior*cos;
            const yExterior=radioExterior*sin;

            vertices.push(
                xInterior,yInterior,0,
                0, 0, 1,
                0.0, i/segmentos
            );

            vertices.push(
                xExterior,yExterior,0,
                0, 0, 1,
                1.0, i/segmentos
            );
        }

        for(let i=0;i<segmentos;i++){
            const actual=i*2;
            const siguiente=actual+2;

            indices.push(
                actual,siguiente,actual+1,
                siguiente,siguiente+1,actual+1
            );
        }

        return{
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }


    static crearCono(radio,altura,segmentos){
        const vertices=[];
        const indices=[];

        for(let i=0;i<=segmentos;i++){
            const u=i/segmentos;
            const theta=u*Math.PI*2;

            const x=radio*Math.cos(theta);
            const z=radio*Math.sin(theta);

            const longitud=Math.sqrt(altura*altura+radio*radio);

            const nx=altura*Math.cos(theta)/longitud;
            const ny=radio/longitud;
            const nz=altura*Math.sin(theta)/longitud;

            vertices.push(
                x,altura,z,
                nx,ny,nz,
                u,1
            );

            vertices.push(
                0,0,0,
                nx,ny,nz,
                u,0
            );
        }

        for(let i=0;i<segmentos;i++){
            const actual=i*2;

            const superiorActual=actual;
            const inferiorActual=actual+1;
            const superiorSiguiente=actual+2;
            const inferiorSiguiente=actual+3;
            indices.push(
                superiorActual,
                inferiorActual,
                superiorSiguiente
            );
            indices.push(
                superiorSiguiente,
                inferiorActual,
                inferiorSiguiente
            );
        }
        return{
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }
}

