import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import './index.scss';
import { mat4, vec3 } from 'gl-matrix';
import 'codyhouse-framework/main/assets/js/util';
import applyMenuBar from './menuBar';
import 'magic.css/dist/magic.css';
import 'babel-polyfill';

function whenEventIsRaised(obj, event) {
    return new Promise((ok, rej) => {
        obj[event] = (e) => {
            ok(e);
            obj[event] = null;
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animate(id, animType, beforeStart) {
    let selector = document.querySelector('#' + id);
    if (beforeStart) beforeStart(selector);

    selector.classList.add('magictime', animType);
    const e = await whenEventIsRaised(selector, "onanimationend");
    selector.classList.remove('magictime', animType);
    return e;
}

async function minWindow(button) {
    button.classList.remove("fa-play");
    button.classList.add("fa-pause");
    let t1 = animate('text', 'puffOut'); await sleep(200);
    let t2 = animate('minimizedWindow', 'puffIn', x => x.style.display = "flex");

    (await t1).target.style.display = "none";
    await t2;
}

async function maxWindow(button) {
    button.classList.remove("fa-pause");
    button.classList.add("fa-play");
    let t1 = animate('minimizedWindow', 'puffOut'); await sleep(200);
    let t2 = animate('text', 'puffIn', x => x.style.display = "block");

    (await t1).target.style.display = "none";
    await t2;
}

document.getElementById("playButton").addEventListener("click", e => {
    let button = e.target;

    if (button.classList.contains("fa-play"))
        minWindow(e.target);
    else if (button.classList.contains("fa-pause"))
        maxWindow(e.target);
});
document.getElementById("minimizedWindow").addEventListener("click", e => {
    maxWindow(document.querySelector("#playButton i"));
});

applyMenuBar();

const canvas = document.getElementById('backgroundCanvas');
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    //TODO resize framebuffer
}
window.onresize = resizeCanvas;
resizeCanvas();

const gl = canvas.getContext("webgl")

let fdraw;

function initRotatingCube() {
    var vertices = [
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
        -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
        -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
        -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
    ];

    var colors = [
        5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
        1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
    ];

    var indices = [
        0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
    ];

    // Create and store data into vertex buffer
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Create and store data into color buffer
    var color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Create and store data into index buffer
    var index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    /*=================== Shaders =========================*/

    var vertCode = 'attribute vec3 position;' +
        'uniform mat4 Pmatrix;' +
        'uniform mat4 Vmatrix;' +
        'uniform mat4 Mmatrix;' +
        'attribute vec3 color;' +//the color of the point
        'varying vec3 vColor;' +

        'void main(void) { ' +//pre-built function
        'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);' +
        'vColor = color;' +
        '}';

    var fragCode = 'precision mediump float;' +
        'varying vec3 vColor;' +
        'void main(void) {' +
        'gl_FragColor = vec4(vColor, 1.);' +
        '}';

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);

    /* ====== Associating attributes to vertex shader =====*/
    var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
    var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
    var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var position = gl.getAttribLocation(shaderProgram, "position");
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

    // Position
    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    var color = gl.getAttribLocation(shaderProgram, "color");
    gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

    // Color
    gl.enableVertexAttribArray(color);
    gl.useProgram(shaderProgram);

    var proj_matrix = mat4.create();
    var view_matrix = mat4.create();
    var model_matrix = mat4.create();

    // target texture
    const targetTextureWidth = canvas.clientWidth;
    const targetTextureHeight = canvas.clientHeight;

    const depthBuffer  = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); 
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);

    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    {
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            targetTextureWidth, targetTextureHeight, border,
            format, type, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const level = 0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    // --

    let screenQuadVBO;
    let screenVertShader;
    let screenFragShader;
    let screenShaderProgram;
    let screenQuadPosition;
    let screenQuadUVs;
    let screenQuadSampler;
    let screenQuadT;
    let screent = 0;
    function drawFullScreenQuad() {
        // Only created once
        if (screenQuadVBO == null) {
            console.log("init")
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

            var vertCode = 'attribute vec2 position;' +
                'attribute vec2 uvs;' +
                'varying vec3 vColor;' +
                'void main(void) { ' +
                'gl_Position = vec4(position,0,1);' +
                'vColor = vec3(uvs,1.);' +
                '}';

            var fragCode = 'precision mediump float;' +
                'uniform sampler2D uSampler;'+
                'uniform float t;'+
                'varying vec3 vColor;' +
                'vec4 toGrayScale(vec4 p)' +
                '{' +
                '   float g = 0.2126*p.r + 0.7152*p.g + 0.0722*p.b;' +
                '	return vec4(g, g, g, p.a);' +
                '}' +
                'void main(void) {' +
                'vec4 p = texture2D(uSampler, vColor.xy);' +
                'vec4 sourceColor = p;' +
                'vec4 destColor = toGrayScale(p);' +
                'gl_FragColor = mix(sourceColor, destColor, t);' +
                '}';

            screenVertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(screenVertShader, vertCode);
            gl.compileShader(screenVertShader);

            screenFragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(screenFragShader, fragCode);
            gl.compileShader(screenFragShader);

            var compiled = gl.getShaderParameter(screenFragShader, gl.COMPILE_STATUS);
            console.log('Shader compiled successfully: ' + compiled);
            var compilationLog = gl.getShaderInfoLog(screenFragShader);
            console.log('Shader compiler log: ' + compilationLog);

            screenShaderProgram = gl.createProgram();
            gl.attachShader(screenShaderProgram, screenVertShader);
            gl.attachShader(screenShaderProgram, screenFragShader);
            gl.linkProgram(screenShaderProgram);

            screenQuadPosition = gl.getAttribLocation(screenShaderProgram, "position");
            screenQuadUVs = gl.getAttribLocation(screenShaderProgram, "uvs");
            screenQuadSampler = gl.getUniformLocation(screenShaderProgram, 'uSampler');
            screenQuadT = gl.getUniformLocation(screenShaderProgram, 't');
        }

        screent += 0.01;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);

        gl.useProgram(screenShaderProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadVBO);        
        gl.enableVertexAttribArray(screenQuadPosition);
            gl.vertexAttribPointer(screenQuadPosition, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(screenQuadUVs);
            gl.vertexAttribPointer(screenQuadUVs, 2, gl.FLOAT, false, 16, 8);
        gl.uniform1i(screenQuadSampler, 0);
        gl.uniform1f(screenQuadT, (Math.cos(screent) + 1)/2);        
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);        
    }

    var time_old = 0;
    fdraw = function (time) {
        var dt = time - time_old;
        mat4.rotateZ(model_matrix, model_matrix, dt * 0.0005);
        mat4.rotateY(model_matrix, model_matrix, dt * 0.0002);
        mat4.rotateX(model_matrix, model_matrix, dt * 0.0003);
        time_old = time;

        mat4.perspective(proj_matrix, 45, canvas.clientWidth / canvas.clientHeight, 1, 100);
        mat4.lookAt(view_matrix,
            vec3.fromValues(-3, 3, 3),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 0)
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.enable(gl.DEPTH_TEST);   
            gl.depthFunc(gl.LEQUAL);
            gl.clearColor(0.5, 0.5, 0.5, 0.9);
            gl.clearDepth(1.0);        
            gl.viewport(0.0, 0.0, canvas.width, canvas.height);
    
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(shaderProgram);
            gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
            gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
            gl.uniformMatrix4fv(Mmatrix, false, model_matrix);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
                gl.enableVertexAttribArray(position);
                    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
                gl.enableVertexAttribArray(color);
                    gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);            
            gl.viewport(0.0, 0.0, canvas.width, canvas.height);
            gl.clearColor(1, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawFullScreenQuad(targetTexture);
        }
    }
}

initRotatingCube();



function draw(time) {
    if (fdraw)
        fdraw(time);
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);