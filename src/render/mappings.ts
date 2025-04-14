import { EFormsType, ERenderType } from '@/render/enums.ts';

export const typeToFormMapping = (render_type: ERenderType): EFormsType[] => {
  switch (render_type) {
    case ERenderType.CANVAS:
      return [EFormsType.RAST, EFormsType.SQUARES];
    case ERenderType.SVG:
      return [EFormsType.SVG, EFormsType.SQUARES];
    case ERenderType.WEBGL:
      return [EFormsType.SQUARES];
    case ERenderType.WEBGl_PIXI:
      return [EFormsType.RAST, EFormsType.SQUARES, EFormsType.SVG];
  }
};
