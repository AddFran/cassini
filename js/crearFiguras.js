import * as matrix from "./operacionesMatrices.js";

export function crearCubo(tamano){
    const vertices=[];
    const indices=[];

    const h=tamano/2;

    // Definimos una sola cara: la frontal (+Z)
    // Cada vértice tiene posición y coordenadas UV
    const cara = [
        [-h, -h, h, 0, 0],
        [ h, -h, h, 1, 0],
        [ h,  h, h, 1, 1],
        [-h,  h, h, 0, 1]
    ];

    // Normal inicial de la cara frontal
    const normalInicial = [0, 0, 1];

    // Matrices para orientar la cara en las seis direcciones
    const rotaciones=[
        matrix.matrizIdentidad4(),               // Frontal (+Z)
        matrix.matrizRotacionY(Math.PI),         // Trasera (-Z)
        matrix.matrizRotacionY(Math.PI/2),       // Derecha (+X)
        matrix.matrizRotacionY(-Math.PI/2),      // Izquierda (-X)
        matrix.matrizRotacionX(-Math.PI/2),      // Superior (+Y)
        matrix.matrizRotacionX(Math.PI/2)        // Inferior (-Y)
    ];

    for(const rotacion of rotaciones){
        const base=vertices.length/8;

        // Transformamos los cuatro vertices de la cara
        for(const v of cara){
            const posicion=matrix.transformarPunto(
                rotacion,
                [v[0], v[1], v[2]]
            );

            const normal=matrix.transformarNormal(
                rotacion,
                normalInicial
            );

            // Posición (3), normal (3), UV (2)
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

        // Dos triangulos por cara
        indices.push(
            base, base + 1, base + 2,
            base, base + 2, base + 3
        );
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

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


export function crearCilindro(radio, altura, segmentos) {
    const vertices=[];
    const indices=[];

    const mitadAltura=altura/2;

    // Generamos los vertices de la superficie lateral
    for(let i=0;i<=segmentos;i++){
        const u=i/segmentos;
        const theta=u*Math.PI*2;

        const x=radio*Math.cos(theta);
        const z=radio*Math.sin(theta);

        const nx=Math.cos(theta);
        const nz=Math.sin(theta);

        // Vertice inferior
        vertices.push(
            x,-mitadAltura,z,
            nx,0,nz,
            u,0
        );

        // Vertice superior
        vertices.push(
            x,mitadAltura,z,
            nx,0,nz,
            u,1
        );
    }

    // Indices de la superficie lateral
    for(let i=0;i<segmentos;i++){
        const actual=i*2;
        const siguiente=actual+2;

        indices.push(
            actual,actual+1,siguiente,
            actual+1,siguiente+1,siguiente
        );
    }

    // Centro de la base inferior
    const centroInferior=vertices.length/8;

    vertices.push(
        0,-mitadAltura,0,
        0,-1,0,
        0.5,0.5
    );

    // Centro de la base superior
    const centroSuperior=vertices.length/8;

    vertices.push(
        0,mitadAltura,0,
        0,1,0,
        0.5,0.5
    );

    // Vertices independientes para las tapas
    for(let i=0;i<segmentos;i++){
        const theta1=(i/segmentos)*Math.PI*2;
        const theta2=((i+1)/segmentos)*Math.PI*2;

        const x1=radio*Math.cos(theta1);
        const z1=radio*Math.sin(theta1);
        const x2=radio*Math.cos(theta2);
        const z2=radio*Math.sin(theta2);

        const base=vertices.length/8;

        // Base inferior
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

        indices.push(
            centroInferior,base+1,base
        );

        // Base superior
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

        indices.push(
            centroSuperior,baseSuperior,baseSuperior+1
        );
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}


export function crearPrismaTriangular(tamano, longitud){
    const vertices = [];
    const indices = [];

    const h = tamano / 2;
    const altura = (Math.sqrt(3) / 2) * tamano;

    // Triángulo equilátero inicial en el plano XY.
    // Cada vértice contiene posición (x,y,z) y UV (u,v).
    const cara = [
        [-h, -altura / 3, 0, 0, 0],
        [ h, -altura / 3, 0, 1, 0],
        [ 0,  2 * altura / 3, 0, 0.5, 1]
    ];

    // Desplazamos el triángulo a lo largo del eje Z.
    const desplazamiento = matrix.matrizTraslacion4(
        0, 0, longitud
    );

    const baseInicial = cara.map(v => [
        v[0], v[1], v[2]
    ]);

    const baseFinal = cara.map(v =>
        matrix.transformarPunto(
            desplazamiento,
            [v[0], v[1], v[2]]
        )
    );

    // Añade una cara triangular o rectangular.
    // Calcula su normal a partir de sus primeros tres vértices.
    function agregarCara(puntos, coordenadasUV){
        const base = vertices.length / 8;

        const arista1 = matrix.restarVec3(
            puntos[1], puntos[0]
        );

        const arista2 = matrix.restarVec3(
            puntos[2], puntos[0]
        );

        const normal = matrix.normalizarVec3(
            matrix.productoCruz(arista1, arista2)
        );

        // Posición (3), normal (3), UV (2).
        for(let i = 0; i < puntos.length; i++){
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

        // Triángulo: 3 vértices.
        // Rectángulo: 4 vértices y 2 triángulos.
        if(puntos.length === 3){
            indices.push(
                base, base + 1, base + 2
            );
        } else {
            indices.push(
                base, base + 1, base + 2,
                base, base + 2, base + 3
            );
        }
    }

    const uvTriangulo = [
        [0, 0],
        [1, 0],
        [0.5, 1]
    ];

    // Base inicial: invertir el orden para que la normal
    // apunte hacia -Z.
    agregarCara(
        [baseInicial[0], baseInicial[2], baseInicial[1]],
        [uvTriangulo[0], uvTriangulo[2], uvTriangulo[1]]
    );

    // Base final: normal hacia +Z.
    agregarCara(
        baseFinal,
        uvTriangulo
    );

    // Tres caras laterales que conectan ambas bases.
    for(let i = 0; i < 3; i++){
        const siguiente = (i + 1) % 3;

        const puntos = [
            baseInicial[i],
            baseInicial[siguiente],
            baseFinal[siguiente],
            baseFinal[i]
        ];

        const uvRectangulo = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1]
        ];

        agregarCara(puntos, uvRectangulo);
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}

export function crearAnillo(radioInterior, radioExterior, segmentos) {
    const vertices = [];
    const indices = [];

    // El anillo se construye inicialmente en el plano XY.
    // Cada segmento tiene un vértice interior y otro exterior.
    for (let i = 0; i <= segmentos; i++) {
        const angulo = (i / segmentos) * Math.PI * 2;

        const cos = Math.cos(angulo);
        const sin = Math.sin(angulo);

        const xInterior = radioInterior * cos;
        const yInterior = radioInterior * sin;

        const xExterior = radioExterior * cos;
        const yExterior = radioExterior * sin;

        // Vértice interior: posición, normal y UV.
        vertices.push(
            xInterior, yInterior, 0,
            0, 0, 1,
            i / segmentos, 0
        );

        // Vértice exterior.
        vertices.push(
            xExterior, yExterior, 0,
            0, 0, 1,
            i / segmentos, 1
        );
    }

    // Cada tramo se divide en dos triángulos.
    for (let i = 0; i < segmentos; i++) {
        const actual = i * 2;
        const siguiente = actual + 2;

        indices.push(
            actual, siguiente, actual + 1,
            siguiente, siguiente + 1, actual + 1
        );
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}