let screenQuadVBO;
let screenVertShader;

function drawFullScreenQuad(gl, textures,
    shaderProgram, 
    locations, setUniform,
    positionLocation, uvsLocation, samplerLocations)
{
    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadVBO);        
    gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(uvsLocation);
        gl.vertexAttribPointer(uvsLocation, 2, gl.FLOAT, false, 16, 8);

    for(var i = 0;i < textures.length; ++i)
    {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.uniform1i(samplerLocations[i], i);
    }

    if(setUniform)
        setUniform(locations);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);        
}

function setupQuadVBO(gl)
{
    if(!screenQuadVBO)
    {
        var verts = [
            // First triangle:
            1.0,  1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0,
            -1.0, -1.0, 0.0, 0.0,
            // Second triangle:
            -1.0, -1.0, 0.0, 0.0,
            -1.0,  1.0, 0.0, 1.0, 
            1.0,  1.0, 1.0, 1.0
        ];
        screenQuadVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    }
}

function setupVertShader(gl)
{
    if(!screenVertShader)
    {
        var vertCode = 'attribute vec2 position;' +
            'attribute vec2 uvs;' +
            'varying vec3 vColor;' +
            'void main(void) { ' +
            'gl_Position = vec4(position,0,1);' +
            'vColor = vec3(uvs,1.);' +
            '}';

        screenVertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(screenVertShader, vertCode);
        gl.compileShader(screenVertShader);
    }
}

export function setupFullScreenQuad(gl, uniforms, fragCode)
{
    setupQuadVBO(gl);
    setupVertShader(gl);

    let screenFragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(screenFragShader, fragCode);
    gl.compileShader(screenFragShader);

    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, screenVertShader);
    gl.attachShader(shaderProgram, screenFragShader);
    gl.linkProgram(shaderProgram);

    var positionLocation = gl.getAttribLocation(shaderProgram, "position");
    var uvsLocation = gl.getAttribLocation(shaderProgram, "uvs");
    var samplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");

    let locations = uniforms.map(x => gl.getUniformLocation(shaderProgram, x));

    return (texture, setUniform) => {
        drawFullScreenQuad(gl, [texture],
            shaderProgram,
            locations, setUniform,
            positionLocation, uvsLocation, [samplerLocation]);
    }
}

export function setupMixTextures(gl, nTextures, uniforms, fragCode)
{
    setupQuadVBO(gl);
    setupVertShader(gl);

    let screenFragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(screenFragShader, fragCode);
    gl.compileShader(screenFragShader);

    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, screenVertShader);
    gl.attachShader(shaderProgram, screenFragShader);
    gl.linkProgram(shaderProgram);

    var positionLocation = gl.getAttribLocation(shaderProgram, "position");
    var uvsLocation = gl.getAttribLocation(shaderProgram, "uvs");
    
    var samplerLocations = [...Array(nTextures).keys()]
        .map(x => gl.getUniformLocation(shaderProgram, "uSampler" + x));

    let locations = uniforms.map(x => gl.getUniformLocation(shaderProgram, x));

    return (textures, setUniform) => {
        drawFullScreenQuad(gl, textures,
            shaderProgram,
            locations, setUniform,
            positionLocation, uvsLocation, samplerLocations);
    }
}