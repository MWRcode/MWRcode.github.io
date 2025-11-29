// Compile a shader (vertex or fragment) from source
function compileShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Link a program given a vertex and fragment shader source
function createProgram(gl, vertSrc, fragSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    // After linking, the shader objects are no longer needed. They can be detached and deleted:
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('Validation failed:', gl.getProgramInfoLog(program));
    }
    return program;
}

// Create a VAO containing a single full‐screen quad (two triangles)
function createFullScreenQuad(gl) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // 6 vertices → two triangles covering NDC [-1,-1] to [1,1]
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

    const colors = new Float32Array([0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const vbo2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo2);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    return vao;
}

function createArrays(length) {
    let centers = [];
    let colors = [];
    for (let i = 0; i < length * 3; i++) {
        colors.push(Math.random());
    }
    for (let i = 0; i < length; i++) {
        centers.push(Math.random() * canvas.width);
        centers.push(Math.random() * canvas.height);
    }
    return [centers, colors];
}

let gl, canvas, quadVAO, program;

canvas = document.getElementById('shaderCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl = canvas.getContext('webgl2');
if (!gl) {
    alert('WebGL 2 is not supported by this browser.');
}

const vertSrc = `#version 300 es
uniform vec2 uResolution;
uniform vec4 uCamera;
layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec3 aColor;
out vec2 vUV;
out vec3 vColor;
out float vRadius;
void main() {
    // Convert aPosition from [-1,1] to [0,1] range for texture-style UVs
    vUV = aPosition * 0.5 + 0.5;
    vUV.y = 1.0 - vUV.y;
    vUV *= uResolution;
    vUV = ((vUV - (uResolution / 2.0)) * uCamera.z) + uCamera.xy + (uResolution / 2.0);
    vColor = aColor;
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vRadius = uCamera.w;
}`;

const fragSrc = `#version 300 es
precision mediump float;
uniform vec2 uCenters[512];
uniform vec3 uColors[512];
in vec2 vUV;
in vec3 vColor;
in float vRadius;
out vec4 fragColor;
void main() {
    bool inCircle = false;
    for (int i = 0; i < 512; i++) {
        if (distance(vUV, uCenters[i]) < vRadius) {
            if (uColors[i].r < 0.0) {discard;}
            inCircle = true;
            fragColor = vec4(uColors[i], 1.0);
        }
    }
    if (!inCircle) {discard;}
}`;

program = createProgram(gl, vertSrc, fragSrc);
quadVAO = createFullScreenQuad(gl);

const uResolution = gl.getUniformLocation(program, "uResolution");
const uCamera = gl.getUniformLocation(program, "uCamera");
const uCenters = gl.getUniformLocation(program, "uCenters");
const uColors = gl.getUniformLocation(program, "uColors");

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
}

let centers = [Array(512 * 2).fill(1000.0)];
let colors = [Array(512 * 3).fill(-1.0)];

let centersIndex = 0;
let colorsIndex = 0;

export function addCircle(xpos, ypos, color) {
    const centersPart = centers[centers.length - 1];
    const colorsPart = colors[colors.length - 1];
    centersPart.splice(centersIndex, 1, xpos);
    centersPart.splice(centersIndex + 1, 1, ypos);
    centersIndex += 2;
    colorsPart.splice(colorsIndex, 1, color[0]);
    colorsPart.splice(colorsIndex + 1, 1, color[1]);
    colorsPart.splice(colorsIndex + 2, 1, color[2]);
    colorsIndex += 3;
    if (centersIndex >= 1023) {
        centersIndex = 0;
        colorsIndex = 0;
        centers.push(Array(512 * 2).fill(1000.0));
        colors.push(Array(512 * 3).fill(-1.0));
    }
    // if (centersPart.length < 1024) {
    //     centersPart.push(...Array(512 * 2 - centersPart.length).fill(1000.0));
    //     colorsPart.push(...Array(512 * 3 - colorsPart.length).fill(-1.0));
    // }
}

export function renderCircles(camera, radius) {
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    gl.bindVertexArray(quadVAO);

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform4f(uCamera, camera.x, camera.y, 1 / camera.zoom, radius);

    // while (centers.length > 0) {
    //     let centersPart = centers.splice(0, 512 * 2).map(parseFloat);
    //     let colorsPart = colors.splice(0, 512 * 3).map(parseFloat);
    //     if (centersPart.length < 1024) {
    //         centersPart.push(...Array(512 * 2 - centersPart.length).fill(1000.0));
    //         colorsPart.push(...Array(512 * 3 - colorsPart.length).fill(-1.0));
    //     }
    //     gl.uniform2fv(uCenters, new Float32Array(centersPart));
    //     gl.uniform3fv(uColors, new Float32Array(colorsPart));

    //     gl.drawArrays(gl.TRIANGLES, 0, 6);
    // }
    for (let i = 0; i < centers.length; i++) {
        let centersPart = centers[i].map(parseFloat);
        let colorsPart = colors[i].map(parseFloat);
        gl.uniform2fv(uCenters, new Float32Array(centersPart));
        gl.uniform3fv(uColors, new Float32Array(colorsPart));

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    // Cleanup current frame state
    gl.bindVertexArray(null);
    gl.useProgram(null);
}