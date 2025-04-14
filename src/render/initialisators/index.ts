import { EFormsType, ERenderType } from '@/render/enums.ts';
import { useCanvasState } from '@/render/initialisators/canvas.ts';
import { usePixiState } from '@/render/initialisators/pixi.ts';
import { useWebglState } from '@/render/initialisators/webgl.ts';
import type { Ref } from 'vue';
import type { IRenderState } from '@/render/types.ts';
import { useSvgState } from '@/render/initialisators/svg.ts';

export const initialiseByType = async (renderType: ERenderType, containerRef: Ref<HTMLDivElement>, countRef: Ref<number>, formsTypeRef: Ref<EFormsType>): Promise<IRenderState> => {
  switch (renderType) {
    case ERenderType.CANVAS:
      return useCanvasState(containerRef, countRef, formsTypeRef);
    case ERenderType.WEBGl_PIXI:
      return await usePixiState(containerRef, countRef, formsTypeRef);
    case ERenderType.WEBGL:
      return useWebglState(containerRef, countRef, formsTypeRef);
    case ERenderType.SVG:
      return useSvgState(containerRef, countRef, formsTypeRef);
  }
}
