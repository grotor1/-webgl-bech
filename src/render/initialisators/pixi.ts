import { ref, type Ref, unref, watch } from 'vue';
import { EFormsType } from '@/render/enums.ts';
import {
  Application, Assets,
  Graphics,
  Particle,
  ParticleContainer,
  Sprite,
  Texture,
  TextureSource,
} from 'pixi.js';

export const usePixiState = async (
  containerRef: Ref<HTMLDivElement>,
  countRef: Ref<number>,
  formsTypeRef: Ref<EFormsType>,
) => {
  const app = new Application();
  const squares: {
    particle: Particle;
    dx: number;
    dy: number;
    size: number;
  }[] = [];

  const initPromise = ref<Promise<void>>();

  const init = async () => {
    if (!containerRef.value) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.style.display = 'block';
    newCanvas.width = containerRef.value.clientWidth;
    newCanvas.height = containerRef.value.clientHeight;

    containerRef.value.innerHTML = ''; // Clear existing content
    containerRef.value.appendChild(newCanvas);

    await app.init({
      canvas: newCanvas,
      resizeTo: containerRef.value,
      backgroundColor: 0xFFFFFF,
      antialias: false,
    });
  };

  const generateTexture = async (): Promise<Texture<TextureSource<any>>> => {
    switch (formsTypeRef.value) {
      case EFormsType.SVG:
        return await Assets.load({
          src: '/test.svg',
        })
      case EFormsType.SQUARES:
        const graphic = new Graphics();

        graphic.rect(0, 0, 50, 50).fill(0xFFFFFF);

       return app.renderer.generateTexture(graphic);
      case EFormsType.RAST:
        return await Assets.load('/test.png')
    }
  }

  const createSquares = async () => {
    if (!app || !app.stage) return;
    app.stage.removeChildren();
    squares.length = 0;

    const container = new ParticleContainer();

    const size = Math.random() * 50 + 10;

    const texture = await generateTexture();

    const screen = app.screen;
    const count = countRef.value;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (screen.width - size);
      const y = Math.random() * (screen.height - size);

      const dx = (Math.random() - 0.5) * 4;
      const dy = (Math.random() - 0.5) * 4;

      const scale = Math.random() + 0.2;

      const particle = new Particle(
        {
          texture,
          x,
          y,
          scaleX: scale,
          scaleY: scale,
        },
      );

      particle.tint = Math.random() * 0xFFFFFF;

      container.addParticle(particle);
      squares.push({ particle, dx, dy, size });
    }

    app.stage.addChild(container);
  };

  const animate = () => {
    if (!app) return;

    app.ticker.add(() => {
      for (let i = 0; i < squares.length; i++) {
        const square = squares[i];
        square.particle.x += square.dx;
        square.particle.y += square.dy;

        if (
          square.particle.x < 0 ||
          square.particle.x + square.size > app.screen.width
        ) {
          square.dx *= -1;
        }

        if (
          square.particle.y < 0 ||
          square.particle.y + square.size > app.screen.height
        ) {
          square.dy *= -1;
        }
      }
    });
  };

  const rerender = async () => {
    await initPromise.value;
    if (!app) return;
    await createSquares();
    animate();
  };

  const cleanUp = () => {
    if (!app) return;
    app.stage.removeChildren();
    squares.length = 0;
  };

  initPromise.value = init();

  return {
    rerender,
    cleanUp,
  };
};
