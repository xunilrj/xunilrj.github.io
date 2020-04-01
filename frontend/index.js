import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import './index.scss';
import {mat4, vec3} from 'gl-matrix';
import 'codyhouse-framework/main/assets/js/util';
import applyMenuBar from './menuBar';
import 'magic.css/dist/magic.css';

document.getElementById("playButton").addEventListener("click", e=> {
    const selector = document.querySelector('#text');
    selector.classList.add('magictime', 'puffOut');
    selector.onanimationend = (e) => {
        e.target.style.display = "none";
        selector.onanimationend = null;
    };
})

applyMenuBar();

const canvas = document.getElementById('backgroundCanvas');
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
}
window.onresize = resizeCanvas;
resizeCanvas();

const gl = canvas.getContext("webgl")

let fdraw;

function initRotatingCube()
{
    var vertices = [
        -1,-1,-1, 1,-1,-1, 1, 1,-1, -1, 1,-1,
        -1,-1, 1, 1,-1, 1, 1, 1, 1, -1, 1, 1,
        -1,-1,-1, -1, 1,-1, -1, 1, 1, -1,-1, 1,
        1,-1,-1, 1, 1,-1, 1, 1, 1, 1,-1, 1,
        -1,-1,-1, -1,-1, 1, 1,-1, 1, 1,-1,-1,
        -1, 1,-1, -1, 1, 1, 1, 1, 1, 1, 1,-1, 
    ];

    var colors = [
        5,3,7, 5,3,7, 5,3,7, 5,3,7,
        1,1,3, 1,1,3, 1,1,3, 1,1,3,
        0,0,1, 0,0,1, 0,0,1, 0,0,1,
        1,0,0, 1,0,0, 1,0,0, 1,0,0,
        1,1,0, 1,1,0, 1,1,0, 1,1,0,
        0,1,0, 0,1,0, 0,1,0, 0,1,0
    ];

    var indices = [
        0,1,2, 0,2,3, 4,5,6, 4,6,7,
        8,9,10, 8,10,11, 12,13,14, 12,14,15,
        16,17,18, 16,18,19, 20,21,22, 20,22,23 
    ];

    // Create and store data into vertex buffer
    var vertex_buffer = gl.createBuffer ();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Create and store data into color buffer
    var color_buffer = gl.createBuffer ();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

     // Create and store data into index buffer
    var index_buffer = gl.createBuffer ();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    /*=================== Shaders =========================*/

    var vertCode = 'attribute vec3 position;'+
        'uniform mat4 Pmatrix;'+
        'uniform mat4 Vmatrix;'+
        'uniform mat4 Mmatrix;'+
        'attribute vec3 color;'+//the color of the point
        'varying vec3 vColor;'+

        'void main(void) { '+//pre-built function
            'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);'+
            'vColor = color;'+
        '}';

    var fragCode = 'precision mediump float;'+
        'varying vec3 vColor;'+
        'void main(void) {'+
            'gl_FragColor = vec4(vColor, 1.);'+
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
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false,0,0) ;

     // Position
    gl.enableVertexAttribArray(position);
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    var color = gl.getAttribLocation(shaderProgram, "color");
    gl.vertexAttribPointer(color, 3, gl.FLOAT, false,0,0) ;

     // Color
    gl.enableVertexAttribArray(color);
    gl.useProgram(shaderProgram);

    var proj_matrix = mat4.create();
    var view_matrix = mat4.create();
    var model_matrix = mat4.create();

    var time_old = 0;
    fdraw = function(time)
    {
        var dt = time-time_old;
        mat4.rotateZ(model_matrix, model_matrix, dt*0.0005);
        mat4.rotateY(model_matrix, model_matrix, dt*0.0002);
        mat4.rotateX(model_matrix, model_matrix, dt*0.0003);
        time_old = time;

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clearColor(0.5, 0.5, 0.5, 0.9);
        gl.clearDepth(1.0);

        mat4.perspective(proj_matrix, 45, canvas.clientWidth/canvas.clientHeight, 1, 100);
        mat4.lookAt(view_matrix, 
            vec3.fromValues(-3,3,3),
            vec3.fromValues(0,0,0),
            vec3.fromValues(0,1,0)
        );

        gl.viewport(0.0, 0.0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
        gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
        gl.uniformMatrix4fv(Mmatrix, false, model_matrix);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

initRotatingCube();



function draw(time)
{
    if(fdraw)
        fdraw(time);
    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);