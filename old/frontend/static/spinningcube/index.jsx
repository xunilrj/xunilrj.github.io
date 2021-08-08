// import webGLDebug from 'webgl-debug';
import { mat4, vec3 } from 'gl-matrix';
import prepr from 'prepr';
import iro from '@jaames/iro';
import { setupFullScreenQuad, setupMixTextures } from './renderQuad.js';
// import webGLDebug from 'webgl-debug';
import { h } from 'preact';
import { useRef, useEffect, useLayoutEffect } from 'preact/hooks';


async function gaussianBlurGLSL(dir, size) {
    let r = await fetch("./spinningcube/gaussianBlur.frag");
    let code = await r.text();
    if (dir.startsWith("h"))
        return prepr(code, { BLURSIZE: size.toFixed("2"), DIR_H: true });
    else if (dir.startsWith("v"))
        return prepr(code, { BLURSIZE: size.toFixed("2"), DIR_V: true });
}

async function mixTextureGLSL() {
    let r = await fetch("./spinningcube/mixTexture.frag");
    return await r.text();
}

function renderTargets(canvas, gl) {
    let targets = {};
    let targetsi = 0;
    const o = {
        renderToScreen: (f) => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0.0, 0.0, canvas.clientWidth, canvas.clientHeight);
            f();
        },
        renderTo: (f, i) => {
            const { frameBuffer, width, height, targetTexture } = targets[i];
            gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
            gl.viewport(0.0, 0.0, width, height);
            f();
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return targetTexture;
        },
        targetTexture: (i) => {
            const { targetTexture } = targets[i];
            return targetTexture;
        },
        gen: (gl, width, height, depth) => {
            let depthBuffer;

            if (depth) {
                depthBuffer = gl.createRenderbuffer();
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
            if (depth) {
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                    gl.RENDERBUFFER, depthBuffer);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);

            let i = targetsi; ++targetsi;
            targets[i] = { depthBuffer, targetTexture, frameBuffer, width, height }
            return i;
        }
    };
    return o;
}

async function buildShader(gl, vertCode, fragCode) {
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    var compiled = gl.getShaderParameter(vertShader, gl.COMPILE_STATUS);
    if (!compiled) {
        var compilationLog = gl.getShaderInfoLog(vertShader);
        console.error('Vertex shader compiler log: ' + compilationLog);
    }

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    var compiled = gl.getShaderParameter(fragShader, gl.COMPILE_STATUS);
    if (!compiled) {
        var compilationLog = gl.getShaderInfoLog(fragShader);
        console.error('Frag shader compiler log: ' + compilationLog);
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var info = gl.getProgramInfoLog(program);
        console.error('Could not compile WebGL program. \n\n' + info);
    }

    var attribs = []
    for (let i = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) - 1; i >= 0; i--) {
        attribs.push(gl.getActiveAttrib(program, i));
    }

    var uniforms = [];
    var uniformByName = {};
    let qtd = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < qtd; ++i) {
        let info = gl.getActiveUniform(program, i);
        let index = gl.getUniformLocation(program, info.name);
        if (index) {
            uniforms.push({ i: index, info });
            uniformByName[info.name] = index;
        }
    }

    var uniformBlocks = []
    qtd = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
    for (let i = 0; i < qtd; ++i) {
        let name = gl.getActiveUniformBlockName(program, i);
        let index = gl.getUniformBlockIndex(program, name);
        let active = gl.getActiveUniformBlockParameter(program, 0, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS);

        uniformBlocks.push({
            i: index,
            name,
            parameters: {
                binding: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_BINDING),
                size: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_DATA_SIZE),
                active: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS),
                indices: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES),
                vs: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
                fs: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
            }
        });
    }

    return {
        program,
        attribs,
        uniforms,
        uniformByName,
        uniformBlocks,
        setUniforms: (arr) => {
            for (let i = 0; i < uniforms.length; ++i) {
                let u = uniforms[i];

                if (!arr[i])
                    console.warn("missing uniform", i, u);

                if (u.info.type == gl.FLOAT_MAT4)
                    gl.uniformMatrix4fv(u.i, false, arr[i]);
                if (u.info.type == gl.FLOAT_VEC3)
                    gl.uniform3fv(u.i, arr[i]);
            }
        },
        setUniformBlocks: (blocks) => {
            gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
            for (let b of uniformBlocks) {
                let block = blocks[b.name];
                if (!block) continue;

                gl.uniformBlockBinding(program, b.i, block.bindi);
            }
            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        },
        setUniform: (name, v) => {
            let i = gl.getUniformLocation(program, name);
            let info = gl.getActiveUniform(program, i);
            if (info.type == gl.FLOAT_MAT4)
                gl.uniformMatrix4fv(i, false, v);
            if (info.type == gl.FLOAT_VEC3)
                gl.uniform3fv(i, v);
        }
    };
}

function createVertexArray(gl, vbos, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    for (var vbo in vbos) {
        let current = vbos[vbo];

        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, current.buffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        current.buffer = buffer;
        current.type = gl.FLOAT;
        current.normalized = false;
        current.stride = 0;
        current.offset = 0;
    }

    const elementArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.bindVertexArray(null);

    let drawElementsInfo = {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        offset: 0
    };

    let indicesLength = indices.length;
    return {
        drawElementsInfo, vao, vbos, elementArrayBuffer, indicesLength,
        drawElements: () => {
            gl.bindVertexArray(vao);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffer);
            gl.drawElements(gl.TRIANGLES, indicesLength, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
    };
}

function bindVertexArrayAndShader(gl, { vao, vbos }, { program, attribs, uniformBlocks }, blocks = {}) {
    gl.bindVertexArray(vao);
    gl.useProgram(program);

    for (let attrib of attribs) {
        let attribi = gl.getAttribLocation(program, attrib.name);
        var info = vbos[attrib.name];
        gl.bindBuffer(gl.ARRAY_BUFFER, info.buffer);
        gl.enableVertexAttribArray(attribi);
        gl.vertexAttribPointer(attribi,
            info.size, info.type, info.normalized,
            info.stride, info.offset);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    for (let b of uniformBlocks) {
        let block = blocks[b.name];
        if (!block) continue;

        gl.bindBuffer(gl.UNIFORM_BUFFER, block.buffer);
        gl.uniformBlockBinding(program, b.i, block.bindi);
    }

    gl.bindVertexArray(null);
    gl.useProgram(null);
}

let buildUBO_BIND_I = 1;
function buildUBO(gl, data) {
    let bindi = buildUBO_BIND_I++;

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, bindi, buffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    return {
        buffer,
        bindi,
        data,
        update: () => {
            gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);

            let offset = 0;
            for (let i = 0; i < data.length; ++i) {
                let d = data[i];
                let l = d.byteLength;

                gl.bufferSubData(gl.ARRAY_BUFFER, offset, d, 0, d.length);

                offset += l;
            }

            gl.bindBuffer(gl.UNIFORM_BUFFER, null);
        },
        bind: (program) => {
            gl.uniformBlockBinding(program, 0, bindi);
        }
    };
}

const fdrawCube = function (gl,
    cr, cg, cb, ca,
    shaderProgram, options,
    globalUB,
    proj_matrix, view_matrix, model_matrix,
    cubevao) {

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(cr, cg, cb, ca);
    gl.clearDepth(1.0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(shaderProgram.program);
    gl.uniformMatrix4fv(shaderProgram.uniformByName.Pmatrix, false, proj_matrix);
    gl.uniformMatrix4fv(shaderProgram.uniformByName.Vmatrix, false, view_matrix);
    gl.uniformMatrix4fv(shaderProgram.uniformByName.Mmatrix, false, model_matrix);

    if (options && options.glowColor) {
        let index = gl.getUniformLocation(shaderProgram.program, "glowColor");
        gl.uniform3fv(index, new Float32Array([
            options.glowColor.r / 255,
            options.glowColor.g / 255,
            options.glowColor.b / 255,
        ]));
    }

    cubevao.drawElements();

    gl.useProgram(null);
};

async function buildNormalRenderShader(gl) {
    let vertCode = `#version 300 es
precision mediump float;

// uniform UBOGlobalVariables {
//     mat4 foo;
// } globalVariables;

uniform mat4 Pmatrix;
uniform mat4 Vmatrix;
uniform mat4 Mmatrix;

in vec3 position;
in vec3 color;

out vec3 inColor;

void main(void)
{
    gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.0);
    inColor = color;
}`;

    let fragCode = `#version 300 es
precision mediump float;

// uniform UBOGlobalVariables {
//     mat4 foo;
// } globalVariables;

in vec3 inColor;
out vec4 outColor;

void main(void)
{    
    // mat4 v = globalVariables.foo;
    outColor = vec4(inColor, 1.0);
}`;

    return await buildShader(gl, vertCode, fragCode);
}

async function buildGlowRenderShader(gl) {
    let vertCode = `#version 300 es

    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;
    
    in vec3 position;
    in vec3 color;
    
    out vec3 inColor;
    
    void main(void)
    {
        gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
        inColor = color;
    }`;

    let fragCode = `#version 300 es
    precision mediump float;
    
    uniform vec3 glowColor;
    float glowIntensity = 5.;
    
    in vec3 inColor;
    out vec4 outColor;

    //https://github.com/tobspr/GLSL-Color-Spaces/blob/master/ColorSpaces.inc.glsl
    const float HCV_EPSILON = 1e-10;
    vec3 rgb_to_hcv(vec3 rgb)
    {
        // Based on work by Sam Hocevar and Emil Persson
        vec4 P = (rgb.g < rgb.b) ? vec4(rgb.bg, -1.0, 2.0/3.0) : vec4(rgb.gb, 0.0, -1.0/3.0);
        vec4 Q = (rgb.r < P.x) ? vec4(P.xyw, rgb.r) : vec4(rgb.r, P.yzx);
        float C = Q.x - min(Q.w, Q.y);
        float H = abs((Q.w - Q.y) / (6. * C + HCV_EPSILON) + Q.z);
        return vec3(H, C, Q.x);
    }

    vec3 rgb_to_hsv(vec3 rgb)
    {
        vec3 HCV = rgb_to_hcv(rgb);
        float S = HCV.y / (HCV.z + HCV_EPSILON);
        return vec3(HCV.x, S, HCV.z);
    }
    
    void main(void)
    {
        vec3 a = rgb_to_hsv(inColor);
        vec3 b = rgb_to_hsv(glowColor);
        float hueDistance = min(abs(a.r-b.r), 1. - abs(b.r-a.r));
        float d = (1.0 - (hueDistance / 0.5));
        d = pow(d, 8.0);
        outColor = mix(vec4(0.), vec4(inColor, 1.), step(0.3, d));
    }`;

    return await buildShader(gl, vertCode, fragCode);
}

async function buildCube(gl) {
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

    let cubevao = createVertexArray(gl, {
        position: { size: 3, buffer: new Float32Array(vertices) },
        color: { size: 3, buffer: new Float32Array(colors) }
    }, new Uint16Array(indices));

    return Promise.resolve(cubevao);
}

async function initRotatingCube(canvas, gl, renderTargets) {
    // let globalUB = buildUBO(gl, [mat4.identity(mat4.create())]);

    let normalRender = await buildNormalRenderShader(gl);
    let glowRender = await buildGlowRenderShader(gl);
    let cubevao = await buildCube(gl);

    bindVertexArrayAndShader(gl, cubevao, normalRender, { /*UBOGlobalVariables: globalUB*/ });

    var proj_matrix = mat4.create();
    var view_matrix = mat4.create();
    var model_matrix = mat4.create();

    const sceneTarget = renderTargets.gen(gl, 256, 256, true);
    const hBlurTarget = renderTargets.gen(gl, 256, 256, false);
    const vBlurTarget = renderTargets.gen(gl, 256, 256, false);
    const fullSceneTarget = renderTargets.gen(gl,
        canvas.clientWidth, canvas.clientHeight,
        true);

    const hBlurRender = setupFullScreenQuad(gl, ["t", "blurStepSize"], await gaussianBlurGLSL("h", 16));
    const vBlurRender = setupFullScreenQuad(gl, ["t", "blurStepSize"], await gaussianBlurGLSL("v", 16));
    const mixTexturesRender = setupMixTextures(gl, 2, [], await mixTextureGLSL());

    var time_old = 0;

    let screent = 0;
    let fdraw = function (time) {
        var dt = time - time_old;
        time_old = time;

        mat4.rotateZ(model_matrix, model_matrix, dt * 0.0005);
        mat4.rotateY(model_matrix, model_matrix, dt * 0.0002);
        mat4.rotateX(model_matrix, model_matrix, dt * 0.0003);
        mat4.perspective(proj_matrix, 45, canvas.clientWidth / canvas.clientHeight, 1, 100);
        mat4.lookAt(view_matrix,
            vec3.fromValues(-3, 3, 3),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 0)
        );

        // globalUB.update();

        // render glow

        let glowColor = { r: 255, g: 0, b: 0 };
        if (colorPicker) {
            glowColor = colorPicker.color.rgb;
        }

        const smallScene = renderTargets.renderTo(
            x => fdrawCube(gl,
                0, 0, 0, 0,
                glowRender,
                { glowColor },
                null, proj_matrix, view_matrix, model_matrix,
                cubevao),
            sceneTarget);

        const hBlurTexture = renderTargets.renderTo(x => {
            hBlurRender(smallScene, ([t, blurStepSize]) => {
                gl.uniform1f(t, (Math.cos(screent) + 1) / 2);
                gl.uniform1f(blurStepSize, 1.0 / 256.0);
            });
        }, hBlurTarget);

        const bluredTexture = renderTargets.renderTo(x => {
            vBlurRender(hBlurTexture, ([t, blurStepSize]) => {
                gl.uniform1f(t, (Math.cos(screent) + 1) / 2);
                gl.uniform1f(blurStepSize, 1.0 / 256.0);
            });
        }, vBlurTarget);

        // // render scene

        const fullSceneTexture = renderTargets.renderTo(
            x => fdrawCube(gl,
                0.5, 0.5, 0.5, 1,
                normalRender,
                null,
                null, proj_matrix, view_matrix, model_matrix, cubevao),
            fullSceneTarget);

        // // mix them 

        renderTargets.renderToScreen(() => mixTexturesRender([fullSceneTexture, bluredTexture]));
    }
    return fdraw;
}

function useWebAnimation(id, state, keyframes, timeline) {
    const el = useRef();
    useLayoutEffect(() => {
        if (!state) return;

        const anim = el.current.animate(keyframes, timeline);

        let i;
        switch (state) {
            case "start": { i = keyframes.length - 1; anim.play(); break; }
            case "start-reverse": { i = 0; anim.reverse(); break; }
        }

        anim.finished.then(x => {
            //anim.commitStyles(); // Not Working
            let transformation = keyframes[i];
            el.current.style.transform = transformation.transform;
        })
    }, [state]);
    return el;
}

function usePrevious(state) {
    let ref = useRef();
    let tmp = ref.current;
    ref.current = state;
    return tmp;
}

function useColorPicker() {
    var el = useRef();
    useEffect(() => {
        colorPicker = new iro.ColorPicker(el.current, {
            width: 150,
            color: "#f00"
        });
    }, []);
    return el;
}

export function Main() {
    return <canvas id="backgroundCanvas" style="width: 100vw; height: 100vh;position: absolute;z-index:-1">
    </canvas>
}

let colorPicker;
export function Options({ visible }) {
    let colorPicker = useColorPicker();

    let action;
    let prevVisible = usePrevious(visible);
    if (!prevVisible && visible) action = "start";
    if (prevVisible && !visible) action = "start-reverse";
    const animation = useWebAnimation("optionAnim", action, [
        { opacity: 0, transform: "scale(1, 1) translateX(-900%)", offset: 0 },
        { opacity: 1, transform: "scale(1.1, 1.1) translateX(0)", offset: 0.5 },
        { opacity: 1, transform: "scale(1, 1) translateX(0)", offset: 0.6 },
        { opacity: 1, transform: "scale(1.1, 1.1) translateX(0)", offset: 0.7 },
        { opacity: 1, transform: "scale(1, 1) translateX(0)", offset: 0.8 },
        { opacity: 1, transform: "scale(1.1, 1.1) translateX(0)", offset: 0.9 },
        { opacity: 1, transform: "scale(1, 1) translateX(0)", offset: 1 }
    ], {
        duration: 1000,
        iterations: 1,
    });

    let classes = "";
    let style = "padding:10px;position: absolute;width: 170px;height: 250px; left:10px; background: white; transform: translateX(-900%)";
    return <div ref={animation} style={style} class={classes}>
        <h3>Glow Color</h3>
        <div ref={colorPicker}>
        </div>
    </div >;
}

let stop = false;
let stopok;
export async function load() {
    const canvas = document.getElementById('backgroundCanvas');
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        //TODO resize framebuffer
    }
    window.onresize = resizeCanvas;
    resizeCanvas();

    let gl = canvas.getContext("webgl2");
    // gl = webGLDebug.makeDebugContext(gl, (err, funcName, args) => {
    //     throw (`${webGLDebug.glEnumToString(err)} was caused by call to ${funcName}(${webGLDebug.glFunctionArgsToString(funcName, args)})`)
    // });

    let targets = renderTargets(canvas, gl);
    let fdraw = await initRotatingCube(canvas, gl, targets);

    function draw(time) {
        if (stop) {
            gl.getExtension('WEBGL_lose_context').loseContext();
            stopok();
            return;
        }

        if (fdraw)
            fdraw(time);
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
}

export async function unload() {
    stop = true;
    await new Promise((ok, rej) => {
        stopok = ok;
    });
}