export class RenderManager {
  constructor(canvas, circleRadius, lineThickness) {
    this.canvas = canvas;
    this.circleCount = 0;
    this.circleQueue = [];

    this.circleSize = circleRadius;
    this.lineThickness = lineThickness;

    navigator.gpu?.requestAdapter()
      .then((adapter) => {
        this.adapter = adapter;
        adapter?.requestDevice()
          .then((device) => {
            if (!device) {
              alert("need a browser that supports WebGPU");
            } else {
              this.device = device;
              this.runInit();
            }
          })
      });
  }
  runInit() {
    this.setupCanvas();

    this.createShadersPipeline();
    this.setupInstanceBuffers();
    this.setupUniforms();
    this.setupInstaceMech();

    this.setupRenderPass();

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    if (this.onReady) this.onReady();
  }
  setupCanvas() {
    this.context = this.canvas.getContext("webgpu");
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
    });
  }
  getInstanceBufferCount() {
    const stepSize = 16384;
    return Math.ceil(this.circleCount / stepSize) * stepSize;
  }
  addToInstanceBuffer(instances, previousCircleCount) {
    const instanceUnitSize = 4 + 8 + 8; // unorm8x4, vec2f, vec2f
    const instanceBufferSize = instanceUnitSize * this.getInstanceBufferCount();

    if (this.instanceBuffer && (instanceBufferSize > this.instanceBuffer.size)) {
      this.instanceBuffer.destroy();

      this.instanceBuffer = this.device.createBuffer({
        label: "instance attributes buffer",
        size: instanceBufferSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

      const oldArrayValues = this.instanceBufferValuesU8;

      this.instanceBufferValuesU8 = new Uint8Array(instanceBufferSize);

      this.instanceBufferValuesU8.set(oldArrayValues);

      this.device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceBufferValuesU8);
    }

    const newInstancesU8 = new Uint8Array(instances.length * instanceUnitSize);
    const newInstancesF32 = new Float32Array(newInstancesU8.buffer);
    for (let i = 0; i < instances.length; i++) {
      const bufferOffsetU8 = i * instanceUnitSize;
      const bufferOffsetF32 = bufferOffsetU8 / 4;

      newInstancesU8.set( // set the color
        instances[i][0],
        bufferOffsetU8);

      newInstancesF32.set( // set the offset and lineDirection
        instances[i][1],
        bufferOffsetF32 + 1); // add 1 to skip over 4 bytes of color
    }
    this.instanceBufferValuesU8.set(newInstancesU8, previousCircleCount * instanceUnitSize);
    this.device.queue.writeBuffer(this.instanceBuffer, previousCircleCount * instanceUnitSize, newInstancesF32);
  }
  createShadersPipeline() {
    this.module = this.device.createShaderModule({
      code: /* wgsl */ `
        struct Vertex {
          @location(0) position: vec2f,
          @location(1) color: vec4f,
          @location(2) offset: vec2f,
          @location(3) lineDirection: vec2f,
        };

        struct VSOutput {
          @builtin(position) position: vec4f,
          @location(0) color: vec4f,
          @location(1) uvCord: vec2f,
        };

        @group(0) @binding(0) var<uniform> viewTransform: vec3f;
        @group(0) @binding(1) var<uniform> resolution: vec2f;

        @vertex fn vs( vert: Vertex ) -> VSOutput {
          const circleSize = ${this.circleSize};

          var vsOut: VSOutput;

          var position = vert.position;
          if (abs(vert.position.x) == circleSize) {
            vsOut.color = vert.color;
            vsOut.uvCord = (vert.position / circleSize + vec2f(1.0)) / 2;
          } else {
            vsOut.color = vec4f(0.3125, 0.3125, 0.3125, 0.0);

            position = normalize(vert.lineDirection.yx) * vec2f(1.0, -1.0) * vert.position.x + vert.lineDirection * vert.position.y;
          }

          vsOut.position = vec4f(((position + vert.offset) * viewTransform.z + viewTransform.xy * viewTransform.z) / resolution, 0.0, 1.0);

          return vsOut;
        }

        @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
          if (distance(vec2f(0.5, 0.5), vsOut.uvCord) > 0.5 && vsOut.color.a > 0.0) {
            discard;
          }

          return vsOut.color;
        }
      `,
    });

    this.pipeline = this.device.createRenderPipeline({
      label: 'circles pipeline',
      layout: 'auto',
      vertex: {
        module: this.module,
        buffers: [
          {
            arrayStride: 2 * 4,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },  // position
            ],
          },
          {
            arrayStride: 4 + 2 * 4 + 2 * 4,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'unorm8x4' },   // color
              { shaderLocation: 2, offset: 4, format: 'float32x2' },  // offset
              { shaderLocation: 3, offset: 12, format: 'float32x2' }, // lineDirection
            ],
          },
        ],
      },
      fragment: {
        module: this.module,
        targets: [{ format: this.presentationFormat }],
      },
    });
  }
  setupInstanceBuffers() {
    const instanceUnitSize = 4 + 8 + 8; // unorm8x4, vec2f, vec2f
    const instanceBufferSize = instanceUnitSize * this.getInstanceBufferCount();

    this.instanceBuffer = this.device.createBuffer({
      label: "instance attributes buffer",
      size: instanceBufferSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.instanceBufferValuesU8 = new Uint8Array(instanceBufferSize);

    this.device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceBufferValuesU8);
  }
  setupUniforms() {
    const viewTransformBufferSize = 4 * 3 // vec3f
    this.viewTransformBuffer = this.device.createBuffer({
      label: "viewTransform uniform buffer",
      size: viewTransformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const resolutionBufferSize = 4 * 2 // vec2f
    this.resolutionBuffer = this.device.createBuffer({
      label: "resolution uniform buffer",
      size: resolutionBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = this.device.createBindGroup({
      label: "uniforms bind group",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.viewTransformBuffer },
        { binding: 1, resource: this.resolutionBuffer },
      ],
    });
  }
  createInstanceMech() {
    const linesVertexData = new Float32Array(4 * 2);   // 4x vec2f
    const circlesVertexData = new Float32Array(4 * 2); // 4x vec2f

    let offset = 0;
    for (const cornorOffset of [[-1, 1], [-1, -1], [1, 1], [1, -1]]) {
      linesVertexData[offset++] = cornorOffset[0] * this.lineThickness;
      linesVertexData[offset++] = (cornorOffset[1] + 1.0) / 2;

      circlesVertexData[offset - 2] = cornorOffset[0] * this.circleSize;
      circlesVertexData[offset - 1] = cornorOffset[1] * this.circleSize;
    }

    const indexData = new Uint32Array([0, 1, 2, 2, 1, 3]);

    return {
      linesVertexData,
      circlesVertexData,
      indexData,
    };
  }
  setupInstaceMech() {
    const { linesVertexData, circlesVertexData, indexData } = this.createInstanceMech();

    this.linesVertexBuffer = this.device.createBuffer({
      label: "lines vertex buffer",
      size: linesVertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.linesVertexBuffer, 0, linesVertexData);

    this.circlesVertexBuffer = this.device.createBuffer({
      label: "circles vertex buffer",
      size: circlesVertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.circlesVertexBuffer, 0, circlesVertexData);

    this.indexBuffer = this.device.createBuffer({
      label: "index buffer",
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
  }
  setupRenderPass() {
    this.renderPassDescriptor = {
      label: "circles renderPass",
      colorAttachments: [
        {
          // view: to be filled out when we render
          clearValue: [0.125, 0.125, 0.125, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };
  }
  render(viewTransform) {
    // Add queued circles
    if (this.circleQueue.length > 0) {
      this.addCircles(this.circleQueue);
      this.circleQueue = [];
    }

    // Setup Uniforms
    this.device.queue.writeBuffer(this.viewTransformBuffer, 0, new Float32Array([-viewTransform.x * window.innerWidth / this.canvas.width * 2, viewTransform.y * window.innerHeight / this.canvas.height * 2, viewTransform.zoom]));

    this.device.queue.writeBuffer(this.resolutionBuffer, 0, new Float32Array([this.canvas.width, this.canvas.height]));

    // Set render pass decriptor
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();

    // Queue commands
    const encoder = this.device.createCommandEncoder();

    // Lines
    let pass = encoder.beginRenderPass(this.renderPassDescriptor);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.linesVertexBuffer);
    pass.setVertexBuffer(1, this.instanceBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint32');

    if (viewTransform.zoom > 0.05) { // hide lines if zoomed out far
      pass.drawIndexed(6, this.circleCount);
    }

    // Circles
    pass.setVertexBuffer(0, this.circlesVertexBuffer);

    pass.drawIndexed(6, this.circleCount);

    pass.end();

    const commandBuffer = encoder.finish();

    this.device.queue.submit([commandBuffer]);
  }
  addCircles(circles) {
    const previousCircleCount = this.circleCount;
    this.circleCount += circles.length;
    this.addToInstanceBuffer(circles, previousCircleCount);
  }
  addCircle(pos, color, lineDirection) {
    this.circleQueue.push([color.concat(255), [pos[0] * 2, pos[1] * 2, lineDirection[0] * 2, lineDirection[1] * 2]]);
  }
  clearCircles() {
    this.circleCount = 0;
    this.circleQueue = [];
    this.setupInstanceBuffers();
  }
}