<template>
  <div class="wrapper">
    <div class="menu">
      <label class="menu__range">
        <span>
          Количество элементов
        </span>


        <input type="range" min="5000" max="500000" step="5000" v-model="elementCount">
      </label>

      {{ elementCount }}

      <label class="menu__select">
        <span>
          Тип ренедера
        </span>

        <select v-model="renderType">
          <option v-for="(value, key) in ERenderType" :key="key" :value="value">
            {{ key }}
          </option>
        </select>
      </label>

      <label class="menu__select">
        <span>
          Тип элементов
        </span>

        <select v-model="formType">
          <option v-for="(value, key) in EFormsType" :key="key" :value="value">
            {{ key }}
          </option>
        </select>
      </label>

      <button @click="state?.rerender()">
        Ререндер
      </button>
    </div>

    <div ref="container" class="container" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, type Ref, ref } from 'vue';
import { useInitCanvas } from '@/render/init.ts';
import { EFormsType, ERenderType } from '@/render/enums.ts';
import type { IRenderState } from '@/render/types.ts';

const elementCount = ref<number>(10000);

const container = ref<HTMLDivElement | null>(null);

const renderType = ref<ERenderType>(ERenderType.WEBGl_PIXI);

const formType = ref<EFormsType>(EFormsType.SQUARES);

let state: Ref<IRenderState | undefined>;

onMounted(() => {
  state = useInitCanvas(container as Ref<HTMLDivElement>, elementCount, renderType, formType).state;
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.container {
  width: 100%;
  height: 100%;
  position: absolute;
}

.menu {
  position: absolute;
  top: 0;
  right: 0;
  background: #ffffffe0;

  display: flex;
  flex-direction: column;
  gap: 5px;

  padding: 10px;

  z-index: 10;

  &__range {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 15px;
  }

  &__select {
    display: flex;
    width: 100%;
    gap: 15px;
    flex-direction: column;
  }
}
</style>
