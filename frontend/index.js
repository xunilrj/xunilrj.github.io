import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import './index.scss';
import { mat4, vec3 } from 'gl-matrix';
import 'codyhouse-framework/main/assets/js/util';
import applyMenuBar from './menuBar';
import 'magic.css/dist/magic.css';
import 'babel-polyfill';
import {setupFullScreenQuad, setupMixTextures} from './renderQuad.js';
import gaussianBlurCODE from './gaussianBlur.glsl';
import mixTextureCODE from './mixTexture.frag';
import prepr from 'prepr';

function gaussianBlurGLSL(dir, size)
{
    if(dir.startsWith("h"))
        return prepr(gaussianBlurCODE, {BLURSIZE: size.toFixed("2"), DIR_H: true});
    else if(dir.startsWith("v"))
        return prepr(gaussianBlurCODE, {BLURSIZE: size.toFixed("2"), DIR_V: true});
}

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

let targets = {};
let targetsi = 0;
const renderTargets = {
    renderToScreen: (f) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);
        f();
    },
    renderTo: (f, i) => {
        const {frameBuffer, width, height, targetTexture} = targets[i];
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.viewport(0.0, 0.0, width, height);
        f();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return targetTexture;
    },
    targetTexture: (i) => {
        const {targetTexture} = targets[i];
        return targetTexture;
    },
    gen: (gl, width, height, depth) => {
        let depthBuffer;

        if(depth)
        {
            depthBuffer  = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); 
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 
                width, height);
        }

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
                width, height, border,
                format, type, data);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        const frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, targetTexture, 0);
        if(depth)
        {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                gl.RENDERBUFFER, depthBuffer);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        let i = targetsi; ++targetsi;
        targets[i] = {depthBuffer, targetTexture, frameBuffer, width, height}
        return i;
    }
};

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

    const fullSceneTarget = renderTargets.gen(gl, 
        canvas.clientWidth, canvas.clientHeight,
        true);

    const sceneTarget = renderTargets.gen(gl, 256, 256, true);
    const hBlurTarget = renderTargets.gen(gl, 256, 256, false);
    const vBlurTarget = renderTargets.gen(gl, 256, 256, false);

    const hBlurRender = setupFullScreenQuad(gl, ["t","blurStepSize"], gaussianBlurGLSL("h", 8));
    const vBlurRender = setupFullScreenQuad(gl, ["t","blurStepSize"], gaussianBlurGLSL("v", 8));
    const mixTexturesRender = setupMixTextures(gl, 2, [], mixTextureCODE);

    var time_old = 0;
    const fdrawCube = function(cr,cg,cb, ca) {
        gl.enable(gl.DEPTH_TEST);   
        gl.depthFunc(gl.LEQUAL);

        gl.clearColor(cr, cg, cb, ca);
        gl.clearDepth(1.0);

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

    };

    let screent = 0;
    fdraw = function (time) {
        var dt = time - time_old;
        time_old = time;

        mat4.rotateZ(model_matrix, model_matrix, dt * 0.0005);
        mat4.rotateY(model_matrix, model_matrix, dt * 0.0002);
        mat4.rotateX(model_matrix, model_matrix, dt * 0.0003);
        mat4.perspective(proj_matrix, 45, 
            canvas.clientWidth / canvas.clientHeight, 1, 100);
        mat4.lookAt(view_matrix,
            vec3.fromValues(-3, 3, 3),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 0)
        );

        const smallScene = renderTargets.renderTo(
            x => fdrawCube(0,0,0,0),
            sceneTarget);

        const hBlurTexture = renderTargets.renderTo(x => {
            hBlurRender(smallScene, ([t,blurStepSize]) => {
                gl.uniform1f(t, (Math.cos(screent) + 1)/2);        
                gl.uniform1f(blurStepSize, 1.0/256.0);   
            });
        }, hBlurTarget);

        const bluredTexture = renderTargets.renderTo(x => {
            vBlurRender(hBlurTexture, ([t,blurStepSize]) => {
                gl.uniform1f(t, (Math.cos(screent) + 1)/2);        
                gl.uniform1f(blurStepSize, 1.0/256.0);   
            });
        }, vBlurTarget);

        const fullSceneTexture = renderTargets.renderTo(
            x => fdrawCube(0.5,0.5,0.5,1),
            fullSceneTarget);

        renderTargets.renderToScreen(() => {
            mixTexturesRender([fullSceneTexture, bluredTexture], () => {

            })
        });
    }
}

initRotatingCube();



function draw(time) {
    if (fdraw)
        fdraw(time);
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);