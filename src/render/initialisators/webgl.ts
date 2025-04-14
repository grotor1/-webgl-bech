import { ref, type Ref } from 'vue';
import { EFormsType } from '@/render/enums.ts';

interface Square {
  x: number;
  y: number;
  size: number;
  height: number;
  color: [number, number, number, number];
  dx: number;
  dy: number;
}

export const useWebglState = (
  containerRef: Ref<HTMLDivElement | null>,
  countRef: Ref<number>,
  formsTypeRef: Ref<EFormsType>
) => {
  const canvas = ref<HTMLCanvasElement | null>(null);
  const gl = ref<WebGLRenderingContext | null>(null);
  let squares: Square[] = [];
  let program: WebGLProgram | null = null;

  let positionBuffer: WebGLBuffer | null = null;
  let colorBuffer: WebGLBuffer | null = null;
  let texcoordBuffer: WebGLBuffer | null = null;

  let positionLocation = -1;
  let colorLocation = -1;
  let texcoordLocation = -1;
  let resolutionLocation: WebGLUniformLocation | null = null;
  let useTextureLocation: WebGLUniformLocation | null = null;

  let texture: WebGLTexture | null = null;
  let textureLoaded = false;
  let textureAspect = 1;

  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec4 a_color;
    attribute vec2 a_texcoord;
    uniform vec2 u_resolution;
    varying vec4 v_color;
    varying vec2 v_texcoord;
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_color = a_color;
      v_texcoord = a_texcoord;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;

    varying vec4 v_color;
    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    uniform int u_useTexture;

    void main() {
      vec4 texColor = texture2D(u_texture, v_texcoord);
      vec4 baseColor = (u_useTexture == 1) ? texColor * v_color : v_color;

      gl_FragColor = baseColor;
    }
  `;

  const createShader = (
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null => {
    const shader: WebGLShader | null = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const createProgram = (
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram | null => {
    const prog: WebGLProgram | null = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  };

  const loadTexture = (url: string): void => {
    if (!gl.value) return;
    texture = gl.value.createTexture();
    const image = new Image();
    image.src = url;
    image.onload = () => {
      textureAspect = image.width / image.height;
      gl.value!.bindTexture(gl.value!.TEXTURE_2D, texture);
      gl.value!.texImage2D(gl.value!.TEXTURE_2D, 0, gl.value!.RGBA, gl.value!.RGBA, gl.value!.UNSIGNED_BYTE, image);

      gl.value!.texParameteri(gl.value!.TEXTURE_2D, gl.value!.TEXTURE_WRAP_S, gl.value!.CLAMP_TO_EDGE);
      gl.value!.texParameteri(gl.value!.TEXTURE_2D, gl.value!.TEXTURE_WRAP_T, gl.value!.CLAMP_TO_EDGE);
      gl.value!.texParameteri(gl.value!.TEXTURE_2D, gl.value!.TEXTURE_MIN_FILTER, gl.value!.LINEAR);

      textureLoaded = true;
    };
  };


  const init = (): void => {
    if (!containerRef.value) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = containerRef.value.clientWidth;
    newCanvas.height = containerRef.value.clientHeight;
    newCanvas.style.display = 'block';
    containerRef.value.innerHTML = '';
    containerRef.value.appendChild(newCanvas);

    canvas.value = newCanvas;
    gl.value = newCanvas.getContext('webgl');
    if (!gl.value) {
      console.error('WebGL not supported');
      return;
    }

    gl.value.enable(gl.value.BLEND);
    gl.value.blendFunc(gl.value.SRC_ALPHA, gl.value.ONE_MINUS_SRC_ALPHA);

    const vertexShader = createShader(gl.value, gl.value.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.value, gl.value.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    program = createProgram(gl.value, vertexShader, fragmentShader);
    if (!program) return;

    gl.value.useProgram(program);
    positionLocation = gl.value.getAttribLocation(program, 'a_position');
    colorLocation = gl.value.getAttribLocation(program, 'a_color');
    texcoordLocation = gl.value.getAttribLocation(program, 'a_texcoord');
    resolutionLocation = gl.value.getUniformLocation(program, 'u_resolution');
    useTextureLocation = gl.value.getUniformLocation(program, 'u_useTexture');

    gl.value.viewport(0, 0, newCanvas.width, newCanvas.height);

    // Load the texture (replace with your actual image path)
    loadTexture('/test.png');
  };

  const cleanUp = () => {
    if (positionBuffer) gl.value?.deleteBuffer(positionBuffer);
    if (colorBuffer) gl.value?.deleteBuffer(colorBuffer);
    if (texcoordBuffer) gl.value?.deleteBuffer(texcoordBuffer);
    squares = [];
  };

  const updatePositionsBuffer = (): void => {
    if (!gl.value || !positionBuffer) return;
    const positions = new Float32Array(squares.length * 6 * 2);
    let pIndex = 0;
    for (const { x, y, size: width, height } of squares) {
      const vertices = [
        x, y,
        x + width, y,
        x, y + height,
        x, y + height,
        x + width, y,
        x + width, y + height,
      ];
      for (const v of vertices) positions[pIndex++] = v;
    }
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer);
    gl.value.bufferData(gl.value.ARRAY_BUFFER, positions, gl.value.DYNAMIC_DRAW);
    gl.value.vertexAttribPointer(positionLocation, 2, gl.value.FLOAT, false, 0, 0);
    gl.value.enableVertexAttribArray(positionLocation);
  };

  const updateColorsBuffer = (): void => {
    if (!gl.value || !colorBuffer) return;
    const colors = new Float32Array(squares.length * 6 * 4);
    let cIndex = 0;
    for (const { color } of squares) {
      for (let j = 0; j < 6; j++) {
        colors[cIndex++] = color[0];
        colors[cIndex++] = color[1];
        colors[cIndex++] = color[2];
        colors[cIndex++] = color[3];
      }
    }
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, colorBuffer);
    gl.value.bufferData(gl.value.ARRAY_BUFFER, colors, gl.value.STATIC_DRAW);
    gl.value.vertexAttribPointer(colorLocation, 4, gl.value.FLOAT, false, 0, 0);
    gl.value.enableVertexAttribArray(colorLocation);
  };

  const updateTexcoordsBuffer = (): void => {
    if (!gl.value || !texcoordBuffer) return;
    const texcoords = new Float32Array(squares.length * 6 * 2);
    let tIndex = 0;
    const coords = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];
    for (let i = 0; i < squares.length; i++) {
      for (let j = 0; j < coords.length; j++) {
        texcoords[tIndex++] = coords[j];
      }
    }
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, texcoordBuffer);
    gl.value.bufferData(gl.value.ARRAY_BUFFER, texcoords, gl.value.STATIC_DRAW);
    gl.value.vertexAttribPointer(texcoordLocation, 2, gl.value.FLOAT, false, 0, 0);
    gl.value.enableVertexAttribArray(texcoordLocation);
  };

  const createSquares = (): void => {
    cleanUp();
    if (!gl.value) return;

    positionBuffer = gl.value.createBuffer();
    colorBuffer = gl.value.createBuffer();
    texcoordBuffer = gl.value.createBuffer();

    const count: number = countRef.value;
    for (let i = 0; i < count; i++) {
      const color: [number, number, number, number] = [
        Math.random(), Math.random(), Math.random(), 1.0,
      ];
      const dx = (Math.random() - 0.5) * 4;
      const dy = (Math.random() - 0.5) * 4;

      const size = Math.random() * 50 + 10;
      const width = size;
      const height = size / (formsTypeRef.value === EFormsType.RAST ? textureAspect : 1);

      const x = Math.random() * ((canvas.value?.width ?? 0) - width);
      const y = Math.random() * ((canvas.value?.height ?? 0) - height);

      squares.push({ x, y, size: width, height, color, dx, dy });
    }

    updateColorsBuffer();
    updateTexcoordsBuffer();
  };

  const animate = (): void => {
    if (!gl.value || !program || !canvas.value) return;

    gl.value.clear(gl.value.COLOR_BUFFER_BIT);
    gl.value.uniform2f(resolutionLocation, canvas.value.width, canvas.value.height);
    gl.value.uniform1i(useTextureLocation, formsTypeRef.value === EFormsType.RAST ? 1 : 0);

    if (formsTypeRef.value === EFormsType.RAST && textureLoaded) {
      gl.value.bindTexture(gl.value.TEXTURE_2D, texture);
    }

    const canvasWidth = canvas.value.width;
    const canvasHeight = canvas.value.height;

    for (const square of squares) {
      square.x += square.dx;
      square.y += square.dy;
      if (square.x + square.size > canvasWidth || square.x < 0) square.dx *= -1;
      if (square.y + square.size > canvasHeight || square.y < 0) square.dy *= -1;
    }

    updatePositionsBuffer();
    gl.value.drawArrays(gl.value.TRIANGLES, 0, squares.length * 6);
    requestAnimationFrame(animate);
  };

  const rerender = (): void => {
    if (!gl.value) return;
    createSquares();
    animate();
  };

  init();

  return {
    rerender,
    cleanUp,
  };
};
