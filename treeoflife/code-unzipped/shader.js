const canvas = document.getElementById("shaderCanvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const gl = canvas.getContext("webgl");

// Vertex shader
const vsSource = `
    uniform vec2 uResolution;
    uniform vec3 uOffset;
    attribute vec2 aPosition;
    attribute vec2 aCenter;
    attribute float aRadius;
    attribute vec3 aColor;
    varying vec2 vCenter;
    varying float vRadius;
    varying vec3 vColor;
    void main() {
        vec2 clipPos = (aPosition / uResolution * 2.0 - 1.0);
        vCenter = vec2(aCenter.x, aCenter.y);
        vCenter = ((aCenter - uOffset.xy) - (uResolution / 2.0)) * uOffset.z + (uResolution / 2.0);
        clipPos = ((clipPos - uOffset.xy / uResolution * 2.0)) * uOffset.z;
        gl_Position = vec4(clipPos.x, clipPos.y * -1.0, 0.0, 1.0);
        vCenter = vec2(vCenter.x, vCenter.y * -1.0 + uResolution.y);
        vRadius = aRadius;
        vColor = aColor;
    }
`;

// Fragment shader
const fsSource = `
    precision mediump float;
    uniform vec2 uResolution;
    varying vec2 vCenter;
    varying float vRadius;
    varying vec3 vColor;
    void main() {
        float dist = distance(gl_FragCoord.xy, vCenter);
        if (dist > vRadius) {discard;}
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
}

const program = createProgram(gl, vsSource, fsSource);
gl.useProgram(program);

// const circles = [
//     { x: 0, y: 0, radius: 500, color: [1.0, 0.0, 0.0] },
//     { x: 200, y: 100, radius: 80, color: [0.0, 1.0, 0.0] },
//     { x: 200, y: 200, radius: 60, color: [0.0, 0.0, 1.0] }
// ];

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

const aPosition = gl.getAttribLocation(program, "aPosition");
const aCenter = gl.getAttribLocation(program, "aCenter");
const aRadius = gl.getAttribLocation(program, "aRadius");
const aColor = gl.getAttribLocation(program, "aColor");

const uResolution = gl.getUniformLocation(program, "uResolution");
const uOffset = gl.getUniformLocation(program, "uOffset");

export function renderCircles(circles, camOffset) {
    let vertices = [];
    circles.forEach(c => {
            const x = c.x, y = c.y, r = c.radius;
            const color = c.color;
            const quad = [
                    x - r, y - r,
                    x + r, y - r,
                    x + r, y + r,
                    x - r, y + r
            ];
            for (let i = 0; i < 4; i++) {
                    vertices.push(
                            quad[i * 2], quad[i * 2 + 1],
                            x, y,
                            c.radius * camOffset.zoom,
                            ...color
                    );
            }
    });

    const indices = [];
    for (let i = 0; i < circles.length; i++) {
        const base = i * 4;
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 8 * 4, 0);

    gl.enableVertexAttribArray(aCenter);
    gl.vertexAttribPointer(aCenter, 2, gl.FLOAT, false, 8 * 4, 2 * 4);

    gl.enableVertexAttribArray(aRadius);
    gl.vertexAttribPointer(aRadius, 1, gl.FLOAT, false, 8 * 4, 4 * 4);

    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 8 * 4, 5 * 4);

    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform3f(uOffset, camOffset.x, camOffset.y, camOffset.zoom);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}