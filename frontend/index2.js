import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import './index.scss';
import { mat4, vec3 } from 'gl-matrix';
import 'codyhouse-framework/main/assets/js/util';
import applyMenuBar from './menuBar';
import 'magic.css/dist/magic.css';
import 'babel-polyfill';
import {setupFullScreenQuad, setupMixTextures} from './renderQuad.js';
import gaussianBlurCODE from './gaussianBlur.frag';
import mixTextureCODE from './mixTexture.frag';
import prepr from 'prepr';
import iro from '@jaames/iro';
import webGLDebug from 'webgl-debug';

var colorPicker = new iro.ColorPicker('#picker',{
    width: 150,
    color: "#f00"
});


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

    await animate('demoMenu', 'tinLeftIn', x => x.style.display = "block");
}

async function maxWindow(button) {
    button.classList.remove("fa-pause");
    button.classList.add("fa-play");

    var t1 = animate('demoMenu', 'tinLeftOut');
    let t2 = animate('minimizedWindow', 'puffOut'); await sleep(200);
    let t3 = animate('text', 'puffIn', x => x.style.display = "block");

    (await t1).target.style.display = "none";
    (await t2).target.style.display = "none";
    await t3;
}

document.getElementById("playButton").addEventListener("click", async (e) => {
    let button = e.target;

    if (button.classList.contains("fa-play"))
        await minWindow(e.target);
    else if (button.classList.contains("fa-pause"))
        await maxWindow(e.target);

    
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

let gl = canvas.getContext("webgl2");
gl = webGLDebug.makeDebugContext(gl, (err, funcName, args) => {
    throw(`${webGLDebug.glEnumToString(err)} was caused by call to ${funcName}(${WebGLDebugUtils.glFunctionArgsToString(funcName, args)})` ) 
});

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

    // // Create and store data into vertex buffer
    // var vertex_buffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // // Create and store data into color buffer
    // var color_buffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // // Create and store data into index buffer
    // var index_buffer = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    /*=================== Shaders =========================*/
    function buildShader(vertCode, fragCode)
    {
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);

        var compiled = gl.getShaderParameter(vertShader, gl.COMPILE_STATUS);
        if(!compiled)
        {
            var compilationLog = gl.getShaderInfoLog(vertShader);
            console.error('Vertex shader compiler log: ' + compilationLog);
        }
    
        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);

        var compiled = gl.getShaderParameter(fragShader, gl.COMPILE_STATUS);
        if(!compiled)
        {
            var compilationLog = gl.getShaderInfoLog(fragShader);
            console.error('Frag shader compiler log: ' + compilationLog);
        }
    
        var program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            var info = gl.getProgramInfoLog(program);
            console.error('Could not compile WebGL program. \n\n' + info);
        }
        
        var attribs = []
        for (let i = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) - 1; i >= 0; i--)
        {
            attribs.push(gl.getActiveAttrib(program, i));
        }

        var uniforms = []
        let qtd = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < qtd; ++i)
        {
            let info = gl.getActiveUniform(program, i);
            let index = gl.getUniformLocation(program, info.name);            
            if(index)
                uniforms.push({ i: index, info });
        }

        var uniformBlocks = []
        qtd = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
        for (let i = 0; i < qtd; ++i)
        {
            let name = gl.getActiveUniformBlockName(program, i); 
            let index = gl.getUniformBlockIndex(program, name);  
            let active = gl.getActiveUniformBlockParameter(program, 0, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS);
            
            uniformBlocks.push({
                i: index,
                name,
                parameters:{
                    binding: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_BINDING),
                    size: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_DATA_SIZE),
                    active: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS),
                    indices: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES),
                    vs: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
                    fs: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
                }
            });
        }
        console.log("uniformBlocks", uniformBlocks)

        // var UBOGlobalVariablesIndex = gl.getUniformBlockIndex(program, 'UBOGlobalVariables');
        // var UBOGlobalVariablesName = gl.getActiveUniformBlockName(program, UBOGlobalVariablesIndex);
        
        // console.log(gl.getActiveUniformBlockName(program, 0));
        // console.log(UBOGlobalVariablesIndex, UBOGlobalVariablesName);
        // console.log("UNIFORM_BLOCK_BINDING", gl.getActiveUniformBlockParameter(program, UBOGlobalVariablesIndex, gl.UNIFORM_BLOCK_BINDING));
        // console.log("UNIFORM_BLOCK_DATA_SIZE", gl.getActiveUniformBlockParameter(program, UBOGlobalVariablesIndex, gl.UNIFORM_BLOCK_DATA_SIZE));
        // console.log("UNIFORM_BLOCK_ACTIVE_UNIFORMS", gl.getActiveUniformBlockParameter(program, UBOGlobalVariablesIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORMS));
        // console.log("UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES", gl.getActiveUniformBlockParameter(program, UBOGlobalVariablesIndex, gl.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES));
        // console.log("UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER", gl.getActiveUniformBlockParameter(program, UBOGlobalVariablesIndex, gl.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER));
        // console.log("UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER", gl.getActiveUniformBlockParameter(program, UBOGlobalVariablesIndex, gl.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER));

        // console.log(uniforms);
        // console.log(uniformBlocks);
        
        return {
            program,
            attribs,
            uniforms,
            uniformBlocks,
            setUniforms: (arr) =>
            {
                for(let i = 0;i < uniforms.length; ++i)
                {
                    let u = uniforms[i];

                    if(!arr[i])
                        console.warn("missing uniform",i, u);
                    
                    if(u.info.type == gl.FLOAT_MAT4)
                        gl.uniformMatrix4fv(u.i, false, arr[i]);
                    if(u.info.type == gl.FLOAT_VEC3)
                        gl.uniform3fv(u.i, arr[i]);
                }
            },
            setUniformBlocks: (blocks) =>
            {
                gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
                for(let b of uniformBlocks)
                {
                    let block = blocks[b.name];
                    if(!block) continue;  
                    
                    console.log(b,block);

                    gl.uniformBlockBinding(program, b.i, block.bindi);
                }
                gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            },
            setUniform: (name, v) =>
            {
                let i = gl.getUniformLocation(program, name);
                let info = gl.getActiveUniform(program, i);                
                if(info.type == gl.FLOAT_MAT4)
                    gl.uniformMatrix4fv(i, false, v);
                if(info.type == gl.FLOAT_VEC3)
                    gl.uniform3fv(i, v);
            }
        };
    }    

    function createVertexArray(vbos, indices)
    {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        for(var vbo in vbos)
        {
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

        return {drawElementsInfo, vao, vbos, elementArrayBuffer};
    }

    function bindVertexArrayAndShader({ vao, vbos }, { program, attribs, uniformBlocks }, blocks = {})
    {
        gl.bindVertexArray(vao);
        gl.useProgram(program);
        
        for(let attrib of attribs)
        {
            let attribi = gl.getAttribLocation(program, attrib.name);
            var info = vbos[attrib.name]; 
            gl.bindBuffer(gl.ARRAY_BUFFER, info.buffer);
            gl.enableVertexAttribArray(attribi);      
            gl.vertexAttribPointer(attribi,
                info.size, info.type, info.normalized,
                info.stride, info.offset);            
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        for(let b of uniformBlocks)
        {
            let block = blocks[b.name];
            if(!block) continue;  
            
            // console.log("bindVertexArrayAndShader", program, gl.getUniformBlockIndex(program, b.name), block.bindi);
            
            gl.bindBuffer(gl.UNIFORM_BUFFER, block.buffer);
            gl.uniformBlockBinding(program, b.i, block.bindi);
        }
        
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }

    let buildUBO_BIND_I = 1;
    function buildUBO(data)
    {
        let bindi = buildUBO_BIND_I++;

        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);        
        gl.bindBufferBase(gl.UNIFORM_BUFFER, bindi, buffer);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        return {
            buffer,
            bindi,
            data,
            update: () =>
            {
                gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);

                let offset = 0;
                for(let i = 0; i < data.length; ++i)
                {
                    let d = data[i];
                    let l = d.byteLength;

                    gl.bufferSubData(gl.ARRAY_BUFFER, offset, d, 0, d.length);

                    offset += l;
                }

                gl.bindBuffer(gl.UNIFORM_BUFFER, null);
            }
        };
    }

    var vertCode = `#version 300 es
precision mediump float;

uniform UBOGlobalVariables {
    mat4 foo;
} globalVariables;

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

    var fragCode = `#version 300 es
precision mediump float;

uniform UBOGlobalVariables {
    mat4 foo;
} globalVariables;

in vec3 inColor;
out vec4 outColor;

void main(void)
{    
    mat4 v = globalVariables.foo;
    outColor = vec4(inColor, globalVariables.foo[0]);
}`;

    let globalUB = buildUBO([mat4.identity(mat4.create())]);
    let normalRender = buildShader(vertCode, fragCode);

    vertCode = `#version 300 es

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
    
    fragCode = `#version 300 es
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
    let glowRender = buildShader(vertCode, fragCode);    
    let cubevao = createVertexArray({
        position: {size: 3, buffer: new Float32Array(vertices)},
        color: {size: 3, buffer: new Float32Array(colors)}
    },  new Uint16Array(indices));
    bindVertexArrayAndShader(cubevao, normalRender, {UBOGlobalVariables: globalUB});

    var proj_matrix = mat4.create();
    var view_matrix = mat4.create();
    var model_matrix = mat4.create();

    const fullSceneTarget = renderTargets.gen(gl, 
        canvas.clientWidth, canvas.clientHeight,
        true);

    const sceneTarget = renderTargets.gen(gl, 256, 256, true);
    const hBlurTarget = renderTargets.gen(gl, 256, 256, false);
    const vBlurTarget = renderTargets.gen(gl, 256, 256, false);

    const hBlurRender = setupFullScreenQuad(gl, ["t","blurStepSize"], gaussianBlurGLSL("h", 16));
    const vBlurRender = setupFullScreenQuad(gl, ["t","blurStepSize"], gaussianBlurGLSL("v", 16));
    const mixTexturesRender = setupMixTextures(gl, 2, [], mixTextureCODE);

    var time_old = 0;
    const fdrawCube = function(cr,cg,cb, ca, shaderProgram, options)
    {
        gl.enable(gl.DEPTH_TEST);   
        gl.depthFunc(gl.LEQUAL);

        gl.clearColor(cr, cg, cb, ca);
        gl.clearDepth(1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        globalUB.update();
        
        let uniforms = [proj_matrix, view_matrix, model_matrix];
        
        if(options && options.glowColor)
        {
            uniforms.push(new Float32Array([
                options.glowColor.r / 255,
                options.glowColor.g / 255,
                options.glowColor.b / 255,
            ]));
        }

        gl.useProgram(shaderProgram.program);
        gl.uniformBlockBinding(shaderProgram.program, 0, 0);

        gl.bindVertexArray(cubevao.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubevao.elementArrayBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.useProgram(null);

        
        // Thinking
        // vbo store
        // vao store
        // eab store
        // program store

        // instance = vao-id, eab-id, program-id, uniforms-set

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


        // render glow

        const smallScene = renderTargets.renderTo(
            x => fdrawCube(0,0,0,0, glowRender, {glowColor: colorPicker.color.rgb}),
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

        // render scene

        const fullSceneTexture = renderTargets.renderTo(
            x => fdrawCube(0.5,0.5,0.5,1, normalRender),
            fullSceneTarget);

        // mix them 

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