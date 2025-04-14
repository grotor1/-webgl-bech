import { ref, type Ref } from 'vue';
import { EFormsType } from '@/render/enums.ts';

export const useCanvasState = (containerRef: Ref<HTMLDivElement>, countRef: Ref<number>, formsTypeRef: Ref<EFormsType>) => {
  const canvas = ref<HTMLCanvasElement | null>(null);
  const ctx = ref<CanvasRenderingContext2D | null>(null);
  let squares: { x: number; y: number; size: number; color: string; dx: number; dy: number }[] = [];

  const init = () => {
    if (!containerRef.value) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = containerRef.value.clientWidth;
    newCanvas.height = containerRef.value.clientHeight;
    newCanvas.style.display = 'block';

    containerRef.value.innerHTML = ''; // Clear existing content
    containerRef.value.appendChild(newCanvas);

    canvas.value = newCanvas;
    ctx.value = newCanvas.getContext('2d');

    if (!ctx.value) return;

    ctx.value.fillStyle = '#FFFFFF';
    ctx.value.fillRect(0, 0, newCanvas.width, newCanvas.height);
  };

  const createSquares = () => {
    squares = [];
    const count = countRef.value;
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 50 + 10; // Square size between 10 and 60
      const x = Math.random() * (canvas.value!.width - size);
      const y = Math.random() * (canvas.value!.height - size);
      const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
      const dx = (Math.random() - 0.5) * 4; // Random X velocity
      const dy = (Math.random() - 0.5) * 4; // Random Y velocity

      squares.push({ x, y, size, color, dx, dy });
    }
  };

  const animate = () => {
    if (!ctx.value || !canvas.value) return;
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    ctx.value.fillStyle = "#FFFFFF";
    ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);

    squares.forEach(square => {
      square.x += square.dx;
      square.y += square.dy;

      if (square.x + square.size > canvas.value!.width || square.x < 0) {
        square.dx *= -1;
      }
      if (square.y + square.size > canvas.value!.height || square.y < 0) {
        square.dy *= -1;
      }

      ctx.value!.fillStyle = square.color;
      ctx.value!.fillRect(square.x, square.y, square.size, square.size);
    });

    requestAnimationFrame(animate);
  };

  const rerender = () => {
    if (!ctx.value || !canvas.value) return;
    createSquares();
    animate();
  };

  const cleanUp = () => {
    squares = [];
  }

  init();

  return {
    rerender,
    cleanUp,
  };
};
