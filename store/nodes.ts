import { AppNode } from "./types";

export const initialNodes = [
  { id: 'n1', type: 'value', position: { x: 0, y: 0 }, data: { 
    data: new Array(60).fill(0)
   } },
  { id: 'n2', type: 'value', position: { x: 0, y: 100 }, data: { 
    data: new Array(60).fill(0) } 
  },
  { id: 'n3', type: 'texture', position: { x: 300, y: 50 }, data: { texture: null, error: null } 
  } ,
  {
    id: 'n4', type: 'rotateTexture', position: { x: 600, y: 50 }, data: {
      texture: null,
      error: null,
    } 
    }
] as AppNode[];