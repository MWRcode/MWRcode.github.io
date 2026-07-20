export class RenderManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.circleCount = 0;
    this.circleQueue = [];

    this.instanceBufferObjectCount = 2 ** 20;
    this.instanceBuffers = [];
    this.instanceValues = [];
    this.instanceBufferOffset = 0;

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
    this.createInstanceBuffers();
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
  createShadersPipeline() {
    this.module = this.device.createShaderModule({
      code: /* wgsl */ `
        struct Vertex {
          @location(0) position: vec2f,
          @location(1) color: vec4f,
          @location(2) offset: vec2f,
          @location(3) lineDirection: vec2i,
        };

        struct VSOutput {
          @builtin(position) position: vec4f,
          @location(0) color: vec4f,
          @location(1) uvCord: vec2f,
        };

        @group(0) @binding(0) var<uniform> viewTransform: vec3f;
        @group(0) @binding(1) var<uniform> resolution: vec2f;
        @group(0) @binding(2) var<uniform> circleRadius: f32;

        @vertex fn vs( vert: Vertex ) -> VSOutput {
          var vsOut: VSOutput;

          var position = vert.position;
          if (abs(vert.position.x) == 1.0) { // Is circle
            vsOut.color = vert.color;
            vsOut.uvCord = (vert.position + vec2f(1.0)) / 2;
            position = position * circleRadius;
          } else { // Is line
            vsOut.color = vec4f(0.3125, 0.3125, 0.3125, 0.5);

            position = normalize(vec2f(f32(vert.lineDirection.y), f32(-vert.lineDirection.x)));
            position = position * vert.position.x * circleRadius / 2 + vec2f(vert.lineDirection) * vert.position.y; // Line thickness is 1/4 circleRadius
          }

          vsOut.position = vec4f(((position + vert.offset) * viewTransform.z + viewTransform.xy * viewTransform.z) / resolution, 0.0, 1.0);

          return vsOut;
        }

        @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
          if ((distance(vec2f(0.5), vsOut.uvCord) > 0.5 && vsOut.color.a > 0.5) || vsOut.color.a == 0.0) {
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
            arrayStride: 4 + 2 * 4 + 2 * 2,
            stepMode: 'instance',
            attributes: [
              { shaderLocation: 1, offset: 0, format: 'unorm8x4' },   // color
              { shaderLocation: 2, offset: 4, format: 'float32x2' },  // offset
              { shaderLocation: 3, offset: 12, format: 'sint16x2' },  // lineDirection
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
  createInstanceBuffers() {
    const instanceUnitSize = 4 + 8 + 4; // unorm8x4, vec2f, vec2i
    const instanceBufferSize = instanceUnitSize * this.instanceBufferObjectCount;

    this.instanceBuffers.push(this.device.createBuffer({
      label: `instance attributes buffer #${this.instanceBuffers.length}`,
      size: instanceBufferSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    }));

    const instanceBufferValuesU8 = new Uint8Array(instanceBufferSize);

    this.instanceValues.push(instanceBufferValuesU8);
  }
  setupUniforms() {
    const viewTransformBufferSize = 4 * 3; // vec3f
    this.viewTransformBuffer = this.device.createBuffer({
      label: "viewTransform uniform buffer",
      size: viewTransformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const resolutionBufferSize = 4 * 2; // vec2f
    this.resolutionBuffer = this.device.createBuffer({
      label: "resolution uniform buffer",
      size: resolutionBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const circleSizeBufferSize = 4; // f32
    this.circleSizeBuffer = this.device.createBuffer({
      label: "circleSize uniform buffer",
      size: circleSizeBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = this.device.createBindGroup({
      label: "uniforms bind group",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.viewTransformBuffer },
        { binding: 1, resource: this.resolutionBuffer },
        { binding: 2, resource: this.circleSizeBuffer },
      ],
    });
  }
  createInstanceMech() {
    const linesVertexData = new Float32Array(4 * 2);   // 4x vec2f
    const circlesVertexData = new Float32Array(4 * 2); // 4x vec2f

    let offset = 0;
    for (const cornorOffset of [[-1, 1], [-1, -1], [1, 1], [1, -1]]) {
      linesVertexData[offset++] = cornorOffset[0] / 2;
      linesVertexData[offset++] = (cornorOffset[1] + 1.0) / 2;

      circlesVertexData[offset - 2] = cornorOffset[0];
      circlesVertexData[offset - 1] = cornorOffset[1];
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
  render(viewTransform, circleRadius) {
    // Setup Uniforms
    this.device.queue.writeBuffer(this.viewTransformBuffer, 0, new Float32Array([-viewTransform.x * window.innerWidth / this.canvas.width * 2, viewTransform.y * window.innerHeight / this.canvas.height * 2, viewTransform.zoom]));

    this.device.queue.writeBuffer(this.resolutionBuffer, 0, new Float32Array([this.canvas.width, this.canvas.height]));

    this.device.queue.writeBuffer(this.circleSizeBuffer, 0, new Float32Array([circleRadius]));

    // Set render pass decriptor
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();

    // Queue commands
    const encoder = this.device.createCommandEncoder();

    let pass = encoder.beginRenderPass(this.renderPassDescriptor);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setIndexBuffer(this.indexBuffer, 'uint32');

    if (viewTransform.zoom > 0.05) { // hide lines if zoomed out far
      for (let i = 0; i < this.instanceBuffers.length; i++) {
        pass.setVertexBuffer(1, this.instanceBuffers[i]);
        pass.setVertexBuffer(0, this.linesVertexBuffer);

        pass.drawIndexed(6, (i == this.instanceBuffers.length - 1) ? this.instanceBufferOffset : this.instanceBufferObjectCount);
      }
    }

    for (let i = 0; i < this.instanceBuffers.length; i++) {
      pass.setVertexBuffer(1, this.instanceBuffers[i]);
      pass.setVertexBuffer(0, this.circlesVertexBuffer);

      pass.drawIndexed(6, (i == this.instanceBuffers.length - 1) ? this.instanceBufferOffset : this.instanceBufferObjectCount);
    }

    pass.end();

    const commandBuffer = encoder.finish();

    this.device.queue.submit([commandBuffer]);
  }
  addCircle(pos, color, lineDirection) {
    const instanceUnitSize = 4 + 8 + 4; // unorm8x4, vec2f, vec2i

    if (this.instanceBufferOffset >= this.instanceBufferObjectCount - 1) {
      this.createInstanceBuffers();
      this.instanceBufferOffset = 0;
    }

    const newInstancesU8 = new Uint8Array(instanceUnitSize);
    const newInstancesI16 = new Int16Array(newInstancesU8.buffer);
    const newInstancesF32 = new Float32Array(newInstancesU8.buffer);

    newInstancesU8.set(color.concat(255), 0);
    newInstancesF32.set([pos[0] * 2, pos[1] * 2], 1); // skip 4 bytes of color
    newInstancesI16.set([lineDirection[0] * 2, lineDirection[1] * 2], 6); // skip 4 + 8 bytes

    this.instanceValues[this.instanceValues.length - 1].set(newInstancesU8, this.instanceBufferOffset * instanceUnitSize);
    this.device.queue.writeBuffer(this.instanceBuffers[this.instanceBuffers.length - 1], this.instanceBufferOffset * instanceUnitSize, newInstancesU8);

    this.circleCount++;
    this.instanceBufferOffset++;
  }
  clearCircles() {
    this.circleCount = 0;
    this.circleQueue = [];

    this.instanceBuffers = [];
    this.instanceValues = [];
    this.createInstanceBuffers();
    this.instanceBufferOffset = 0;
  }
}