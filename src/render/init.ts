import { Application, Assets, Graphics, GraphicsContext, Sprite } from 'pixi.js';
import { ref, type Ref } from 'vue';
import { watch } from 'vue';
import { initialiseByType } from '@/render/initialisators';
import { EFormsType, type ERenderType } from '@/render/enums.ts';
import type { IRenderState } from '@/render/types.ts';

export const useInitCanvas = (
  containerRef: Ref<HTMLDivElement>,
  countRef: Ref<number>,
  renderTypeRef: Ref<ERenderType>,
  formsTypeRef: Ref<EFormsType>,
) => {
  const state = ref<IRenderState>();

  watch(renderTypeRef, async (value) => {
    state.value?.cleanUp();
    state.value = await initialiseByType(value, containerRef, countRef, formsTypeRef);
  }, {immediate: true});

  return {
    state,
  }
};
