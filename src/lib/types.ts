export interface Position {
   x: number;
   y: number;
}

export interface LayerDataOptions {
   /** Number of generated data points */
   size: number;
   /** Gaussian blur strength applied to generated points */
   spread: number;
   /** Number of random noise points added within bounds */
   noise: number;
   /** Whether to place non-noise points outside (true) or inside (false) boundary */
   inverted: boolean;
   color: string;
   opacity: number;
}

export interface Layer {
   id: string;
   name: string;
   boundaryPoints: Position[];
   order: number;
   isHidden: boolean;
   isLocked: boolean;
   dataOptions: LayerDataOptions;
   data: Position[];
}
