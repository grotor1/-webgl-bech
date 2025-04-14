import { ref, type Ref } from 'vue';
import { EFormsType } from '@/render/enums.ts';

export const useSvgState = (
  containerRef: Ref<HTMLDivElement>,
  countRef: Ref<number>,
  formsTypeRef: Ref<EFormsType>
) => {
  const svgElement = ref<SVGSVGElement | null>(null);

  let items: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    size: number;
    el: SVGGraphicsElement;
  }[] = [];

  const init = () => {
    if (!containerRef.value) return;

    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSvg.setAttribute('width', containerRef.value.clientWidth.toString());
    newSvg.setAttribute('height', containerRef.value.clientHeight.toString());
    newSvg.style.display = 'block';

    containerRef.value.innerHTML = '';
    containerRef.value.appendChild(newSvg);

    svgElement.value = newSvg;
  };

  const createItems = async () => {
    if (!svgElement.value) return;

    items = [];
    const count = countRef.value;
    const width = svgElement.value.clientWidth;
    const height = svgElement.value.clientHeight;

    if (formsTypeRef.value === EFormsType.SVG) {
      // Load and parse external SVG
      const response = await fetch('/test.svg');
      const svgText = await response.text();
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const sourceSvg = parsedDoc.documentElement;
      const innerElements = Array.from(sourceSvg.childNodes).filter((n) => n.nodeType === 1);

      for (let i = 0; i < count; i++) {
        const size = Math.random() * 40 + 20;
        const x = Math.random() * (width - size);
        const y = Math.random() * (height - size);
        const dx = (Math.random() - 0.5) * 4;
        const dy = (Math.random() - 0.5) * 4;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('transform', `translate(${x}, ${y}) scale(${size / 100})`);

        innerElements.forEach((el) => {
          const newEl  = el.cloneNode(true)
          if (newEl instanceof Element) {
            newEl.innerHTML = newEl.innerHTML.replace('#FFFFFF', `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`);
            newEl.innerHTML = newEl.innerHTML.replace('#F0F0F0', `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`);
          }

          group.appendChild(newEl);
        });

        svgElement.value.appendChild(group);
        items.push({ x, y, dx, dy, size, el: group });
      }
    } else {
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 50 + 10;
        const x = Math.random() * (width - size);
        const y = Math.random() * (height - size);
        const dx = (Math.random() - 0.5) * 4;
        const dy = (Math.random() - 0.5) * 4;
        const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', size.toString());
        rect.setAttribute('height', size.toString());
        rect.setAttribute('fill', color);
        rect.setAttribute('transform', `translate(${x}, ${y})`);

        svgElement.value.appendChild(rect);
        items.push({ x, y, dx, dy, size, el: rect });
      }
    }
  };

  const animate = () => {
    if (!svgElement.value) return;

    const width = svgElement.value.clientWidth;
    const height = svgElement.value.clientHeight;

    items.forEach((item) => {
      item.x += item.dx;
      item.y += item.dy;

      if (item.x < 0 || item.x + item.size > width) item.dx *= -1;
      if (item.y < 0 || item.y + item.size > height) item.dy *= -1;

      item.el.setAttribute(
        'transform',
        `translate(${item.x}, ${item.y})` +
        (item.el.tagName === 'g' ? ` scale(${item.size / 100})` : '')
      );
    });

    requestAnimationFrame(animate);
  };

  const rerender = async () => {
    if (!svgElement.value) return;
    svgElement.value.innerHTML = '';
    items = [];
    await createItems();
    animate();
  };

  const cleanUp = () => {
    items = [];
    if (svgElement.value) {
      svgElement.value.innerHTML = '';
    }
  };

  init();

  return {
    rerender,
    cleanUp,
  };
};
