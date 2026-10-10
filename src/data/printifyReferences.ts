import { CaseType } from '../types';

export interface PrintifyTemplateRef {
  id: string;
  brand: 'apple' | 'samsung';
  modelName: string;
  category: 'iPhone' | 'Samsung';
  dimensions: {
    resolutionDpi: number;
    pixelWidth: number;
    pixelHeight: number;
    mmWidth: number;
    mmHeight: number;
    inchWidth: number;
    inchHeight: number;
  };
  cameraCutout: {
    type:
      | 'square-diagonal-dual'
      | 'square-triple-pro'
      | 'pill-vertical'
      | 'pill-horizontal'
      | 'floating-vertical'
      | 'floating-ultra'
      | 'center-rounded';
    position: 'top-left' | 'top-center';
    description: string;
    aspectRatio: number; // width / height
    cornerCurvature: 'round' | 'tight' | 'sharp';
    cutoutWidthPercent?: number;
    cutoutHeightPercent?: number;
    safeZoneTopPercent?: number; // Safe margin from top edge (standard 35%)
  };
  caseFeatures: {
    toughBumper: boolean;
    raisedBezel: boolean;
    wrapBleed: boolean;
  };
  variantId?: number;
  cameraId?: number;
  cameraLabel?: string;
  caseTypeDimensions?: Partial<Record<CaseType, { pixelWidth?: number; pixelHeight?: number; width?: number; height?: number }>>;
}

export const ALL_PRINTIFY_CATALOG_TEMPLATES: PrintifyTemplateRef[] = [
  {
    id: 'iphone-18-pro-max',
    brand: 'apple',
    modelName: 'iPhone 18 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1339,
      pixelHeight: 2275,
      mmWidth: 113.37,
      mmHeight: 192.62,
      inchWidth: 4.46,
      inchHeight: 7.58,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square plateau with rounded corners and next-gen triple Pro lens cluster with LiDAR',
      aspectRatio: 1339 / 2275,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1339,
            "height": 2275
      },
      "clear": {
            "width": 878,
            "height": 1398
      },
      "wallet": {
            "width": 1315,
            "height": 2255
      },
      "eco-friendly": {
            "width": 944,
            "height": 1953
      },
      "snap": {
            "width": 1306,
            "height": 2252
      },
      "flexi": {
            "width": 993,
            "height": 1979
      }
},
  },
  {
    id: 'iphone-18-pro',
    brand: 'apple',
    modelName: 'iPhone 18 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1267,
      pixelHeight: 2116,
      mmWidth: 107.27,
      mmHeight: 179.15,
      inchWidth: 4.22,
      inchHeight: 7.05,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Triple Pro camera plateau with LiDAR sensor',
      aspectRatio: 1267 / 2116,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1267,
            "height": 2116
      },
      "clear": {
            "width": 806,
            "height": 1241
      },
      "wallet": {
            "width": 1242,
            "height": 2097
      },
      "eco-friendly": {
            "width": 872,
            "height": 1795
      },
      "snap": {
            "width": 1234,
            "height": 2093
      },
      "flexi": {
            "width": 921,
            "height": 1821
      }
},
  },
  {
    id: 'iphone-17-pro-max',
    brand: 'apple',
    modelName: 'iPhone 17 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1339,
      pixelHeight: 2275,
      mmWidth: 113.37,
      mmHeight: 192.62,
      inchWidth: 4.46,
      inchHeight: 7.58,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Massive square camera island with 3 large Pro lenses and LiDAR',
      aspectRatio: 1339 / 2275,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1339,
            "height": 2275
      },
      "slim": {
            "width": 1251,
            "height": 2218
      },
      "clear": {
            "width": 989,
            "height": 1998
      },
      "wallet": {
            "width": 2256,
            "height": 2079
      },
      "eco-friendly": {
            "width": 944,
            "height": 1954
      },
      "snap": {
            "width": 1306,
            "height": 2252
      },
      "flexi": {
            "width": 993,
            "height": 1979
      }
},
  },
  {
    id: 'iphone-17-pro',
    brand: 'apple',
    modelName: 'iPhone 17 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1267,
      pixelHeight: 2116,
      mmWidth: 107.27,
      mmHeight: 179.15,
      inchWidth: 4.22,
      inchHeight: 7.05,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Triple Pro lens cluster on elevated square camera plateau',
      aspectRatio: 1267 / 2116,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1267,
            "height": 2116
      },
      "slim": {
            "width": 1201,
            "height": 2080
      },
      "clear": {
            "width": 916,
            "height": 1839
      },
      "wallet": {
            "width": 2114,
            "height": 1914
      },
      "eco-friendly": {
            "width": 872,
            "height": 1795
      },
      "snap": {
            "width": 1234,
            "height": 2093
      },
      "flexi": {
            "width": 921,
            "height": 1821
      }
},
  },
  {
    id: 'iphone-17-air',
    brand: 'apple',
    modelName: 'iPhone 17 Air',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1306,
      pixelHeight: 2198,
      mmWidth: 110.57,
      mmHeight: 186.10,
      inchWidth: 4.35,
      inchHeight: 7.33,
    },
    cameraCutout: {
      type: 'pill-horizontal',
      position: 'top-left',
      description: 'Ultra-slim streamlined camera visor bar housing camera sensor and flash with flush backplate',
      aspectRatio: 1306 / 2198,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.45,
      cutoutHeightPercent: 0.14,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1306,
            "height": 2198
      },
      "slim": {
            "width": 1251,
            "height": 2218
      },
      "clear": {
            "width": 955,
            "height": 1917
      },
      "wallet": {
            "width": 2150,
            "height": 1996
      },
      "eco-friendly": {
            "width": 912,
            "height": 1874
      },
      "snap": {
            "width": 1273,
            "height": 2173
      },
      "flexi": {
            "width": 955,
            "height": 1898
      }
},
  },
  {
    id: 'iphone-17',
    brand: 'apple',
    modelName: 'iPhone 17',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1267,
      pixelHeight: 2122,
      mmWidth: 107.27,
      mmHeight: 179.66,
      inchWidth: 4.22,
      inchHeight: 7.07,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Vertical dual-lens capsule pill cutout with side flash contour',
      aspectRatio: 1267 / 2122,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.22,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1267,
            "height": 2122
      },
      "slim": {
            "width": 1190,
            "height": 2085
      },
      "clear": {
            "width": 917,
            "height": 1839
      },
      "wallet": {
            "width": 2114,
            "height": 1914
      },
      "eco-friendly": {
            "width": 867,
            "height": 1790
      },
      "snap": {
            "width": 1234,
            "height": 2094
      },
      "flexi": {
            "width": 916,
            "height": 1816
      }
},
  },
  {
    id: 'iphone-17e',
    brand: 'apple',
    modelName: 'iPhone 17e',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1255,
      pixelHeight: 2070,
      mmWidth: 106.26,
      mmHeight: 175.26,
      inchWidth: 4.18,
      inchHeight: 6.90,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Single/dual lens streamlined capsule cutout with flash',
      aspectRatio: 1255 / 2070,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.2,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1255,
            "height": 2070
      },
      "clear": {
            "width": 809,
            "height": 1697
      }
},
  },
  {
    id: 'iphone-16-pro-max',
    brand: 'apple',
    modelName: 'iPhone 16 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1359,
      pixelHeight: 2245,
      mmWidth: 115.06,
      mmHeight: 190.08,
      inchWidth: 4.53,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Large square plateau with 3 large Pro lenses and LiDAR sensor',
      aspectRatio: 1359 / 2245,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1359,
            "height": 2245
      },
      "slim": {
            "width": 1311,
            "height": 2197
      },
      "clear": {
            "width": 989,
            "height": 1998
      },
      "wallet": {
            "width": 2335,
            "height": 2104
      },
      "eco-friendly": {
            "width": 938,
            "height": 1946
      },
      "snap": {
            "width": 1311,
            "height": 2197
      },
      "flexi": {
            "width": 989,
            "height": 1974
      }
},
  },
  {
    id: 'iphone-16-pro',
    brand: 'apple',
    modelName: 'iPhone 16 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1246,
      pixelHeight: 2085,
      mmWidth: 105.49,
      mmHeight: 176.53,
      inchWidth: 4.15,
      inchHeight: 6.95,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square camera plateau with 3 large Pro lenses and LiDAR sensor',
      aspectRatio: 1246 / 2085,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1246,
            "height": 2085
      },
      "slim": {
            "width": 1211,
            "height": 2049
      },
      "clear": {
            "width": 916,
            "height": 1839
      },
      "wallet": {
            "width": 2180,
            "height": 1944
      },
      "eco-friendly": {
            "width": 868,
            "height": 1795
      },
      "snap": {
            "width": 1211,
            "height": 2049
      },
      "flexi": {
            "width": 916,
            "height": 1816
      }
},
  },
  {
    id: 'iphone-16-plus',
    brand: 'apple',
    modelName: 'iPhone 16 Plus',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1359,
      pixelHeight: 2245,
      mmWidth: 115.06,
      mmHeight: 190.08,
      inchWidth: 4.53,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Vertical dual-lens pill cutout with side flash contour',
      aspectRatio: 1359 / 2245,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.22,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1359,
            "height": 2245
      },
      "slim": {
            "width": 1311,
            "height": 2197
      },
      "clear": {
            "width": 991,
            "height": 1973
      },
      "wallet": {
            "width": 2335,
            "height": 2104
      },
      "eco-friendly": {
            "width": 941,
            "height": 1920
      },
      "snap": {
            "width": 1311,
            "height": 2197
      },
      "flexi": {
            "width": 991,
            "height": 1949
      }
},
  },
  {
    id: 'iphone-16',
    brand: 'apple',
    modelName: 'iPhone 16',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1246,
      pixelHeight: 2085,
      mmWidth: 105.49,
      mmHeight: 176.53,
      inchWidth: 4.15,
      inchHeight: 6.95,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Vertical dual-lens pill cutout with side flash contour',
      aspectRatio: 1246 / 2085,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.22,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1246,
            "height": 2085
      },
      "slim": {
            "width": 1211,
            "height": 2049
      },
      "clear": {
            "width": 918,
            "height": 1816
      },
      "wallet": {
            "width": 2180,
            "height": 1944
      },
      "eco-friendly": {
            "width": 870,
            "height": 1768
      },
      "snap": {
            "width": 1211,
            "height": 2049
      },
      "flexi": {
            "width": 918,
            "height": 1790
      }
},
  },
  {
    id: 'iphone-16e',
    brand: 'apple',
    modelName: 'iPhone 16e',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1255,
      pixelHeight: 2070,
      mmWidth: 106.26,
      mmHeight: 175.26,
      inchWidth: 4.18,
      inchHeight: 6.90,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Streamlined vertical lens capsule cutout',
      aspectRatio: 1255 / 2070,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.2,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1255,
            "height": 2070
      },
      "clear": {
            "width": 809,
            "height": 1697
      }
},
  },
  {
    id: 'iphone-15-pro-max',
    brand: 'apple',
    modelName: 'iPhone 15 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1359,
      pixelHeight: 2245,
      mmWidth: 115.06,
      mmHeight: 190.08,
      inchWidth: 4.53,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Contoured square plateau with triple Pro lenses and LiDAR',
      aspectRatio: 1359 / 2245,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1359,
            "height": 2245
      },
      "slim": {
            "width": 1251,
            "height": 2218
      },
      "clear": {
            "width": 978,
            "height": 1960
      },
      "wallet": {
            "width": 2335,
            "height": 2104
      },
      "eco-friendly": {
            "width": 944,
            "height": 1914
      },
      "snap": {
            "width": 1311,
            "height": 2197
      },
      "flexi": {
            "width": 978,
            "height": 1937
      }
},
  },
  {
    id: 'iphone-15-pro',
    brand: 'apple',
    modelName: 'iPhone 15 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1246,
      pixelHeight: 2085,
      mmWidth: 105.49,
      mmHeight: 176.53,
      inchWidth: 4.15,
      inchHeight: 6.95,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Contoured square plateau with triple Pro lenses and LiDAR',
      aspectRatio: 1246 / 2085,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1246,
            "height": 2085
      },
      "slim": {
            "width": 1176,
            "height": 2060
      },
      "clear": {
            "width": 906,
            "height": 1804
      },
      "wallet": {
            "width": 2180,
            "height": 1944
      },
      "eco-friendly": {
            "width": 862,
            "height": 1748
      },
      "snap": {
            "width": 1211,
            "height": 2049
      },
      "flexi": {
            "width": 906,
            "height": 1780
      }
},
  },
  {
    id: 'iphone-15-plus',
    brand: 'apple',
    modelName: 'iPhone 15 Plus',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1359,
      pixelHeight: 2245,
      mmWidth: 115.06,
      mmHeight: 190.08,
      inchWidth: 4.53,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Square plateau with diagonal dual lenses and flash',
      aspectRatio: 1359 / 2245,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.38,
      cutoutHeightPercent: 0.23,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1359,
            "height": 2245
      },
      "slim": {
            "width": 1290,
            "height": 2220
      },
      "clear": {
            "width": 990,
            "height": 1972
      },
      "wallet": {
            "width": 2335,
            "height": 2104
      },
      "eco-friendly": {
            "width": 945,
            "height": 1913
      },
      "snap": {
            "width": 1311,
            "height": 2197
      },
      "flexi": {
            "width": 990,
            "height": 1948
      }
},
  },
  {
    id: 'iphone-15',
    brand: 'apple',
    modelName: 'iPhone 15',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1246,
      pixelHeight: 2085,
      mmWidth: 105.49,
      mmHeight: 176.53,
      inchWidth: 4.15,
      inchHeight: 6.95,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Square plateau with diagonal dual lenses and flash',
      aspectRatio: 1246 / 2085,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.38,
      cutoutHeightPercent: 0.23,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1246,
            "height": 2085
      },
      "slim": {
            "width": 1176,
            "height": 2061
      },
      "clear": {
            "width": 918,
            "height": 1816
      },
      "wallet": {
            "width": 2180,
            "height": 1944
      },
      "eco-friendly": {
            "width": 869,
            "height": 1749
      },
      "snap": {
            "width": 1211,
            "height": 2049
      },
      "flexi": {
            "width": 918,
            "height": 1792
      }
},
  },
  {
    id: 'iphone-14-pro-max',
    brand: 'apple',
    modelName: 'iPhone 14 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1365,
      pixelHeight: 2250,
      mmWidth: 115.57,
      mmHeight: 190.50,
      inchWidth: 4.55,
      inchHeight: 7.50,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square camera plateau with triple Pro lenses',
      aspectRatio: 1365 / 2250,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1365,
            "height": 2250
      },
      "slim": {
            "width": 1251,
            "height": 2219
      },
      "clear": {
            "width": 990,
            "height": 1974
      },
      "wallet": {
            "width": 2335,
            "height": 2104
      },
      "eco-friendly": {
            "width": 944,
            "height": 1914
      },
      "snap": {
            "width": 1358,
            "height": 2244
      },
      "flexi": {
            "width": 944,
            "height": 1914
      }
},
  },
  {
    id: 'iphone-14-pro',
    brand: 'apple',
    modelName: 'iPhone 14 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1335,
      pixelHeight: 2132,
      mmWidth: 113.03,
      mmHeight: 180.51,
      inchWidth: 4.45,
      inchHeight: 7.11,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square camera plateau with triple Pro lenses',
      aspectRatio: 1335 / 2132,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1335,
            "height": 2132
      },
      "slim": {
            "width": 1176,
            "height": 2060
      },
      "clear": {
            "width": 918,
            "height": 1818
      },
      "wallet": {
            "width": 2180,
            "height": 1944
      },
      "eco-friendly": {
            "width": 862,
            "height": 1748
      },
      "snap": {
            "width": 1329,
            "height": 2126
      },
      "flexi": {
            "width": 862,
            "height": 1748
      }
},
  },
  {
    id: 'iphone-14-plus',
    brand: 'apple',
    modelName: 'iPhone 14 Plus',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1365,
      pixelHeight: 2247,
      mmWidth: 115.57,
      mmHeight: 190.25,
      inchWidth: 4.55,
      inchHeight: 7.49,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Square plateau with diagonal dual lenses',
      aspectRatio: 1365 / 2247,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.38,
      cutoutHeightPercent: 0.23,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1365,
            "height": 2247
      },
      "slim": {
            "width": 1290,
            "height": 2220
      },
      "clear": {
            "width": 994,
            "height": 1972
      },
      "wallet": {
            "width": 2335,
            "height": 2104
      },
      "eco-friendly": {
            "width": 945,
            "height": 1913
      },
      "snap": {
            "width": 1358,
            "height": 2244
      },
      "flexi": {
            "width": 945,
            "height": 1913
      }
},
  },
  {
    id: 'iphone-14',
    brand: 'apple',
    modelName: 'iPhone 14',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1329,
      pixelHeight: 2126,
      mmWidth: 112.52,
      mmHeight: 180.00,
      inchWidth: 4.43,
      inchHeight: 7.09,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Square plateau with diagonal dual lenses',
      aspectRatio: 1329 / 2126,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.38,
      cutoutHeightPercent: 0.23,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1329,
            "height": 2126
      },
      "slim": {
            "width": 1176,
            "height": 2060
      },
      "clear": {
            "width": 917,
            "height": 1805
      },
      "wallet": {
            "width": 2180,
            "height": 1944
      },
      "eco-friendly": {
            "width": 869,
            "height": 1749
      },
      "snap": {
            "width": 1329,
            "height": 2126
      },
      "flexi": {
            "width": 869,
            "height": 1749
      }
},
  },
  {
    id: 'iphone-13-pro-max',
    brand: 'apple',
    modelName: 'iPhone 13 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1323,
      pixelHeight: 2220,
      mmWidth: 112.01,
      mmHeight: 187.96,
      inchWidth: 4.41,
      inchHeight: 7.40,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square camera plateau with triple Pro lenses',
      aspectRatio: 1323 / 2220,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1323,
            "height": 2220
      },
      "slim": {
            "width": 1251,
            "height": 2218
      },
      "clear": {
            "width": 914,
            "height": 1885
      },
      "wallet": {
            "width": 2333,
            "height": 2103
      },
      "eco-friendly": {
            "width": 968,
            "height": 1924
      },
      "snap": {
            "width": 1287,
            "height": 2185
      },
      "flexi": {
            "width": 992,
            "height": 1950
      }
},
  },
  {
    id: 'iphone-13-pro',
    brand: 'apple',
    modelName: 'iPhone 13 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1240,
      pixelHeight: 2043,
      mmWidth: 104.99,
      mmHeight: 172.97,
      inchWidth: 4.13,
      inchHeight: 6.81,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square camera plateau with triple Pro lenses',
      aspectRatio: 1240 / 2043,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1240,
            "height": 2043
      },
      "slim": {
            "width": 1176,
            "height": 2060
      },
      "clear": {
            "width": 836,
            "height": 1724
      },
      "wallet": {
            "width": 2179,
            "height": 1943
      },
      "eco-friendly": {
            "width": 885,
            "height": 1757
      },
      "snap": {
            "width": 1205,
            "height": 2020
      },
      "flexi": {
            "width": 915,
            "height": 1795
      }
},
  },
  {
    id: 'iphone-13',
    brand: 'apple',
    modelName: 'iPhone 13',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1240,
      pixelHeight: 2043,
      mmWidth: 104.99,
      mmHeight: 172.97,
      inchWidth: 4.13,
      inchHeight: 6.81,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Square plateau with diagonal dual lenses',
      aspectRatio: 1240 / 2043,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.38,
      cutoutHeightPercent: 0.23,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1240,
            "height": 2043
      },
      "slim": {
            "width": 1176,
            "height": 2060
      },
      "clear": {
            "width": 836,
            "height": 1724
      },
      "wallet": {
            "width": 2179,
            "height": 1943
      },
      "eco-friendly": {
            "width": 885,
            "height": 1757
      },
      "snap": {
            "width": 1205,
            "height": 2020
      },
      "flexi": {
            "width": 914,
            "height": 1795
      }
},
  },
  {
    id: 'iphone-13-mini',
    brand: 'apple',
    modelName: 'iPhone 13 Mini',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1122,
      pixelHeight: 1831,
      mmWidth: 95.00,
      mmHeight: 155.02,
      inchWidth: 3.74,
      inchHeight: 6.10,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Compact square plateau with diagonal dual lenses',
      aspectRatio: 1122 / 1831,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.4,
      cutoutHeightPercent: 0.24,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1122,
            "height": 1831
      },
      "slim": {
            "width": 1083,
            "height": 1866
      },
      "clear": {
            "width": 749,
            "height": 1543
      },
      "wallet": {
            "width": 2014,
            "height": 1754
      },
      "eco-friendly": {
            "width": 805,
            "height": 1581
      },
      "snap": {
            "width": 1098,
            "height": 1831
      },
      "flexi": {
            "width": 828,
            "height": 1616
      }
},
  },
  {
    id: 'iphone-12-pro-max',
    brand: 'apple',
    modelName: 'iPhone 12 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1323,
      pixelHeight: 2220,
      mmWidth: 112.01,
      mmHeight: 187.96,
      inchWidth: 4.41,
      inchHeight: 7.40,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square camera plateau with triple lenses',
      aspectRatio: 1323 / 2220,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1323,
            "height": 2220
      },
      "slim": {
            "width": 1251,
            "height": 2218
      },
      "clear": {
            "width": 887,
            "height": 1864
      },
      "wallet": {
            "width": 2291,
            "height": 2037
      },
      "eco-friendly": {
            "width": 940,
            "height": 1896
      },
      "snap": {
            "width": 1287,
            "height": 2185
      },
      "flexi": {
            "width": 954,
            "height": 1932
      }
},
  },
  {
    id: 'iphone-12-pro',
    brand: 'apple',
    modelName: 'iPhone 12 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1240,
      pixelHeight: 2043,
      mmWidth: 104.99,
      mmHeight: 172.97,
      inchWidth: 4.13,
      inchHeight: 6.81,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square camera plateau with triple lenses',
      aspectRatio: 1240 / 2043,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1240,
            "height": 2043
      },
      "clear": {
            "width": 863,
            "height": 1750
      },
      "wallet": {
            "width": 2150,
            "height": 1878
      },
      "eco-friendly": {
            "width": 857,
            "height": 1729
      },
      "snap": {
            "width": 1205,
            "height": 2020
      },
      "flexi": {
            "width": 877,
            "height": 1765
      }
},
  },
  {
    id: 'iphone-12',
    brand: 'apple',
    modelName: 'iPhone 12',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1240,
      pixelHeight: 2043,
      mmWidth: 104.99,
      mmHeight: 172.97,
      inchWidth: 4.13,
      inchHeight: 6.81,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Rounded square module with vertical dual lenses',
      aspectRatio: 1240 / 2043,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.38,
      cutoutHeightPercent: 0.23,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1240,
            "height": 2043
      },
      "slim": {
            "width": 1176,
            "height": 2060
      },
      "clear": {
            "width": 827,
            "height": 1715
      },
      "wallet": {
            "width": 2150,
            "height": 1878
      },
      "eco-friendly": {
            "width": 857,
            "height": 1729
      },
      "snap": {
            "width": 1205,
            "height": 2020
      },
      "flexi": {
            "width": 877,
            "height": 1765
      }
},
  },
  {
    id: 'iphone-12-mini',
    brand: 'apple',
    modelName: 'iPhone 12 Mini',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1122,
      pixelHeight: 1831,
      mmWidth: 95.00,
      mmHeight: 155.02,
      inchWidth: 3.74,
      inchHeight: 6.10,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Compact rounded square module with vertical dual lenses',
      aspectRatio: 1122 / 1831,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.4,
      cutoutHeightPercent: 0.24,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1122,
            "height": 1831
      },
      "slim": {
            "width": 1083,
            "height": 1866
      },
      "clear": {
            "width": 737,
            "height": 1531
      },
      "wallet": {
            "width": 1961,
            "height": 1689
      },
      "eco-friendly": {
            "width": 777,
            "height": 1553
      },
      "snap": {
            "width": 1098,
            "height": 1831
      },
      "flexi": {
            "width": 791,
            "height": 1586
      }
},
  },
  {
    id: 'iphone-11-pro-max',
    brand: 'apple',
    modelName: 'iPhone 11 Pro Max',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1299,
      pixelHeight: 2173,
      mmWidth: 109.98,
      mmHeight: 183.98,
      inchWidth: 4.33,
      inchHeight: 7.24,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square module with triple lenses',
      aspectRatio: 1299 / 2173,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.42,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1299,
            "height": 2173
      },
      "slim": {
            "width": 1288,
            "height": 2220
      },
      "clear": {
            "width": 896,
            "height": 1841
      },
      "wallet": {
            "width": 2274,
            "height": 2002
      },
      "eco-friendly": {
            "width": 907,
            "height": 1854
      },
      "snap": {
            "width": 1211,
            "height": 2126
      },
      "flexi": {
            "width": 907,
            "height": 1854
      }
},
  },
  {
    id: 'iphone-11-pro',
    brand: 'apple',
    modelName: 'iPhone 11 Pro',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1225,
      pixelHeight: 1984,
      mmWidth: 103.72,
      mmHeight: 167.98,
      inchWidth: 4.08,
      inchHeight: 6.61,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Square module with triple lenses',
      aspectRatio: 1225 / 1984,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.41,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1225,
            "height": 1984
      },
      "slim": {
            "width": 1140,
            "height": 1983
      },
      "clear": {
            "width": 819,
            "height": 1675
      },
      "wallet": {
            "width": 2038,
            "height": 1802
      },
      "eco-friendly": {
            "width": 829,
            "height": 1686
      },
      "snap": {
            "width": 1178,
            "height": 1949
      },
      "flexi": {
            "width": 829,
            "height": 1686
      }
},
  },
  {
    id: 'iphone-11',
    brand: 'apple',
    modelName: 'iPhone 11',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1287,
      pixelHeight: 2055,
      mmWidth: 108.97,
      mmHeight: 173.99,
      inchWidth: 4.29,
      inchHeight: 6.85,
    },
    cameraCutout: {
      type: 'square-diagonal-dual',
      position: 'top-left',
      description: 'Square module with dual lenses',
      aspectRatio: 1287 / 2055,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.38,
      cutoutHeightPercent: 0.23,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1287,
            "height": 2055
      },
      "slim": {
            "width": 1200,
            "height": 2040
      },
      "clear": {
            "width": 860,
            "height": 1748
      },
      "wallet": {
            "width": 2177,
            "height": 1918
      },
      "eco-friendly": {
            "width": 881,
            "height": 1769
      },
      "snap": {
            "width": 1193,
            "height": 2008
      },
      "flexi": {
            "width": 881,
            "height": 1769
      }
},
  },
  {
    id: 'iphone-xs-max',
    brand: 'apple',
    modelName: 'iPhone XS MAX',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1288,
      pixelHeight: 2085,
      mmWidth: 109.05,
      mmHeight: 176.53,
      inchWidth: 4.29,
      inchHeight: 6.95,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Vertical oval dual camera module',
      aspectRatio: 1288 / 2085,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.2,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1288,
            "height": 2085
      },
      "snap": {
            "width": 1241,
            "height": 2085
      },
      "flexi": {
            "width": 905,
            "height": 1850
      }
},
  },
  {
    id: 'iphone-xs',
    brand: 'apple',
    modelName: 'iPhone XS',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1184,
      pixelHeight: 1896,
      mmWidth: 100.25,
      mmHeight: 160.53,
      inchWidth: 3.95,
      inchHeight: 6.32,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Vertical oval dual camera module',
      aspectRatio: 1184 / 1896,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.2,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1184,
            "height": 1896
      },
      "snap": {
            "width": 1184,
            "height": 1896
      },
      "flexi": {
            "width": 835,
            "height": 1692
      }
},
  },
  {
    id: 'iphone-xr',
    brand: 'apple',
    modelName: 'iPhone XR',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1264,
      pixelHeight: 2014,
      mmWidth: 107.02,
      mmHeight: 170.52,
      inchWidth: 4.21,
      inchHeight: 6.71,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Single round lens with vertical flash pill',
      aspectRatio: 1264 / 2014,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.2,
      cutoutHeightPercent: 0.18,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1264,
            "height": 2014
      },
      "snap": {
            "width": 1241,
            "height": 2014
      },
      "flexi": {
            "width": 882,
            "height": 1770
      }
},
  },
  {
    id: 'iphone-x',
    brand: 'apple',
    modelName: 'iPhone X',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1184,
      pixelHeight: 1896,
      mmWidth: 100.25,
      mmHeight: 160.53,
      inchWidth: 3.95,
      inchHeight: 6.32,
    },
    cameraCutout: {
      type: 'pill-vertical',
      position: 'top-left',
      description: 'Vertical oval dual camera module',
      aspectRatio: 1184 / 1896,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.2,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1184,
            "height": 1896
      },
      "snap": {
            "width": 1184,
            "height": 1896
      },
      "flexi": {
            "width": 835,
            "height": 1692
      }
},
  },
  {
    id: 'iphone-8-plus',
    brand: 'apple',
    modelName: 'iPhone 8 Plus',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1349,
      pixelHeight: 2154,
      mmWidth: 114.22,
      mmHeight: 182.37,
      inchWidth: 4.50,
      inchHeight: 7.18,
    },
    cameraCutout: {
      type: 'pill-horizontal',
      position: 'top-left',
      description: 'Horizontal dual camera module',
      aspectRatio: 1349 / 2154,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.35,
      cutoutHeightPercent: 0.12,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1349,
            "height": 2154
      },
      "snap": {
            "width": 1341,
            "height": 2142
      },
      "flexi": {
            "width": 930,
            "height": 1878
      }
},
  },
  {
    id: 'iphone-8',
    brand: 'apple',
    modelName: 'iPhone 8',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1152,
      pixelHeight: 1853,
      mmWidth: 97.54,
      mmHeight: 156.89,
      inchWidth: 3.84,
      inchHeight: 6.18,
    },
    cameraCutout: {
      type: 'center-rounded',
      position: 'top-left',
      description: 'Single round camera lens cutout with flash',
      aspectRatio: 1152 / 1853,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.18,
      cutoutHeightPercent: 0.12,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1152,
            "height": 1853
      },
      "snap": {
            "width": 1146,
            "height": 1798
      },
      "flexi": {
            "width": 807,
            "height": 1646
      }
},
  },
  {
    id: 'iphone-7-plus',
    brand: 'apple',
    modelName: 'iPhone 7 Plus',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1359,
      pixelHeight: 2245,
      mmWidth: 115.06,
      mmHeight: 190.08,
      inchWidth: 4.53,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'pill-horizontal',
      position: 'top-left',
      description: 'Horizontal dual camera module',
      aspectRatio: 1359 / 2245,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.35,
      cutoutHeightPercent: 0.12,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "flexi": {
            "width": 930,
            "height": 1878
      }
},
  },
  {
    id: 'iphone-7',
    brand: 'apple',
    modelName: 'iPhone 7',
    category: 'iPhone',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1114,
      pixelHeight: 1888,
      mmWidth: 94.32,
      mmHeight: 159.85,
      inchWidth: 3.71,
      inchHeight: 6.29,
    },
    cameraCutout: {
      type: 'center-rounded',
      position: 'top-left',
      description: 'Single round camera lens cutout with flash',
      aspectRatio: 1114 / 1888,
      cornerCurvature: 'round',
      cutoutWidthPercent: 0.18,
      cutoutHeightPercent: 0.12,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "flexi": {
            "width": 807,
            "height": 1646
      }
},
  },
  {
    id: 'samsung-s26-ultra',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S26 Ultra',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1345,
      pixelHeight: 2286,
      mmWidth: 113.88,
      mmHeight: 193.55,
      inchWidth: 4.48,
      inchHeight: 7.62,
    },
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      description: 'Penta-lens floating array with 3 primary vertical lenses, secondary telephoto and laser AF sensor column',
      aspectRatio: 1345 / 2286,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.44,
      cutoutHeightPercent: 0.32,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1345,
            "height": 2286
      },
      "clear": {
            "width": 895,
            "height": 1900
      },
      "snap": {
            "width": 1311,
            "height": 2256
      },
      "flexi": {
            "width": 982,
            "height": 1980
      }
},
  },
  {
    id: 'samsung-s26-plus',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S26 Plus',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1318,
      pixelHeight: 2226,
      mmWidth: 111.59,
      mmHeight: 188.47,
      inchWidth: 4.39,
      inchHeight: 7.42,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1318 / 2226,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1318,
            "height": 2226
      },
      "clear": {
            "width": 876,
            "height": 1852
      },
      "snap": {
            "width": 1287,
            "height": 2209
      },
      "flexi": {
            "width": 955,
            "height": 1920
      }
},
  },
  {
    id: 'samsung-s26',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S26',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1269,
      pixelHeight: 2122,
      mmWidth: 107.44,
      mmHeight: 179.66,
      inchWidth: 4.23,
      inchHeight: 7.07,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1269 / 2122,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1269,
            "height": 2122
      },
      "clear": {
            "width": 815,
            "height": 1734
      },
      "snap": {
            "width": 1240,
            "height": 2102
      },
      "flexi": {
            "width": 907,
            "height": 1815
      }
},
  },
  {
    id: 'samsung-s25-ultra',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S25 Ultra',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1359,
      pixelHeight: 2244,
      mmWidth: 115.06,
      mmHeight: 189.99,
      inchWidth: 4.53,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      description: 'Penta-lens floating array with 3 primary vertical lenses, secondary telephoto and laser AF sensor column',
      aspectRatio: 1359 / 2244,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.44,
      cutoutHeightPercent: 0.32,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1359,
            "height": 2244
      },
      "clear": {
            "width": 895,
            "height": 1900
      },
      "wallet": {
            "width": 2197,
            "height": 2067
      },
      "snap": {
            "width": 1323,
            "height": 2244
      },
      "flexi": {
            "width": 961,
            "height": 1967
      }
},
  },
  {
    id: 'samsung-s25-plus',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S25 Plus',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1314,
      pixelHeight: 2231,
      mmWidth: 111.25,
      mmHeight: 188.89,
      inchWidth: 4.38,
      inchHeight: 7.44,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1314 / 2231,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1314,
            "height": 2231
      },
      "clear": {
            "width": 876,
            "height": 1852
      },
      "wallet": {
            "width": 2138,
            "height": 2020
      },
      "snap": {
            "width": 1282,
            "height": 2204
      },
      "flexi": {
            "width": 939,
            "height": 1915
      }
},
  },
  {
    id: 'samsung-s25',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S25',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1251,
      pixelHeight: 2097,
      mmWidth: 105.92,
      mmHeight: 177.55,
      inchWidth: 4.17,
      inchHeight: 6.99,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1251 / 2097,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1251,
            "height": 2097
      },
      "clear": {
            "width": 815,
            "height": 1718
      },
      "wallet": {
            "width": 2020,
            "height": 1878
      },
      "snap": {
            "width": 1225,
            "height": 2074
      },
      "flexi": {
            "width": 876,
            "height": 1780
      }
},
  },
  {
    id: 'samsung-s24-ultra',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S24 Ultra',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1364,
      pixelHeight: 2296,
      mmWidth: 115.49,
      mmHeight: 194.39,
      inchWidth: 4.55,
      inchHeight: 7.65,
    },
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      description: 'Penta-lens floating array with 3 primary vertical lenses, secondary telephoto and laser AF sensor column',
      aspectRatio: 1364 / 2296,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.44,
      cutoutHeightPercent: 0.32,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1364,
            "height": 2296
      },
      "clear": {
            "width": 858,
            "height": 1898
      },
      "wallet": {
            "width": 2339,
            "height": 2079
      },
      "snap": {
            "width": 1323,
            "height": 2268
      },
      "flexi": {
            "width": 992,
            "height": 1961
      }
},
  },
  {
    id: 'samsung-s24-plus',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S24 Plus',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1314,
      pixelHeight: 2231,
      mmWidth: 111.25,
      mmHeight: 188.89,
      inchWidth: 4.38,
      inchHeight: 7.44,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1314 / 2231,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1314,
            "height": 2231
      },
      "clear": {
            "width": 868,
            "height": 1844
      },
      "wallet": {
            "width": 2256,
            "height": 2032
      },
      "snap": {
            "width": 1282,
            "height": 2204
      },
      "flexi": {
            "width": 952,
            "height": 1917
      }
},
  },
  {
    id: 'samsung-s24',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S24',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1251,
      pixelHeight: 2097,
      mmWidth: 105.92,
      mmHeight: 177.55,
      inchWidth: 4.17,
      inchHeight: 6.99,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1251 / 2097,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1251,
            "height": 2097
      },
      "clear": {
            "width": 810,
            "height": 1714
      },
      "wallet": {
            "width": 2162,
            "height": 1890
      },
      "snap": {
            "width": 1225,
            "height": 2074
      },
      "flexi": {
            "width": 889,
            "height": 1781
      }
},
  },
  {
    id: 'samsung-s23-ultra',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S23 Ultra',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1370,
      pixelHeight: 2304,
      mmWidth: 115.99,
      mmHeight: 195.07,
      inchWidth: 4.57,
      inchHeight: 7.68,
    },
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      description: 'Penta-lens floating array with 3 primary vertical lenses, secondary telephoto and laser AF sensor column',
      aspectRatio: 1370 / 2304,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.44,
      cutoutHeightPercent: 0.32,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1370,
            "height": 2304
      },
      "clear": {
            "width": 868,
            "height": 1894
      },
      "wallet": {
            "width": 2350,
            "height": 2109
      },
      "snap": {
            "width": 1322,
            "height": 2268
      },
      "flexi": {
            "width": 863,
            "height": 1929
      }
},
  },
  {
    id: 'samsung-s23-plus',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S23 Plus',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1335,
      pixelHeight: 2220,
      mmWidth: 113.03,
      mmHeight: 187.96,
      inchWidth: 4.45,
      inchHeight: 7.40,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1335 / 2220,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1335,
            "height": 2220
      },
      "clear": {
            "width": 856,
            "height": 1820
      },
      "wallet": {
            "width": 2263,
            "height": 2026
      },
      "snap": {
            "width": 1288,
            "height": 2186
      },
      "flexi": {
            "width": 872,
            "height": 1836
      }
},
  },
  {
    id: 'samsung-s23',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S23',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1252,
      pixelHeight: 2066,
      mmWidth: 106.00,
      mmHeight: 174.92,
      inchWidth: 4.17,
      inchHeight: 6.89,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Vertical column of 3 distinct floating circular camera lenses with adjacent flash cutout',
      aspectRatio: 1252 / 2066,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.22,
      cutoutHeightPercent: 0.3,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1252,
            "height": 2066
      },
      "clear": {
            "width": 794,
            "height": 1685
      },
      "wallet": {
            "width": 2162,
            "height": 1878
      },
      "snap": {
            "width": 1204,
            "height": 2032
      },
      "flexi": {
            "width": 809,
            "height": 1701
      }
},
  },
  {
    id: 'samsung-s22-ultra',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S22 Ultra',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1323,
      pixelHeight: 2268,
      mmWidth: 112.01,
      mmHeight: 192.02,
      inchWidth: 4.41,
      inchHeight: 7.56,
    },
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      description: 'P-shaped contour or individual floating lens array with laser AF and telephoto column',
      aspectRatio: 1323 / 2268,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.44,
      cutoutHeightPercent: 0.32,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1323,
            "height": 2268
      },
      "clear": {
            "width": 828,
            "height": 1892
      },
      "wallet": {
            "width": 2315,
            "height": 2079
      },
      "snap": {
            "width": 1299,
            "height": 2244
      },
      "flexi": {
            "width": 914,
            "height": 1913
      }
},
  },
  {
    id: 'samsung-s22-plus',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S22 Plus',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1299,
      pixelHeight: 2185,
      mmWidth: 109.98,
      mmHeight: 185.00,
      inchWidth: 4.33,
      inchHeight: 7.28,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Contour-cut camera island wrapping edge with circular flash cutout',
      aspectRatio: 1299 / 2185,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.28,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1299,
            "height": 2185
      },
      "clear": {
            "width": 900,
            "height": 1919
      },
      "wallet": {
            "width": 2303,
            "height": 2055
      },
      "snap": {
            "width": 1274,
            "height": 2173
      },
      "flexi": {
            "width": 875,
            "height": 1849
      }
},
  },
  {
    id: 'samsung-s22',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S22',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1228,
      pixelHeight: 2031,
      mmWidth: 103.97,
      mmHeight: 171.96,
      inchWidth: 4.09,
      inchHeight: 6.77,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Contour-cut camera island wrapping edge with circular flash cutout',
      aspectRatio: 1228 / 2031,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.28,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1228,
            "height": 2031
      },
      "clear": {
            "width": 794,
            "height": 1683
      },
      "wallet": {
            "width": 2197,
            "height": 1913
      },
      "snap": {
            "width": 1193,
            "height": 2008
      },
      "flexi": {
            "width": 817,
            "height": 1705
      }
},
  },
  {
    id: 'samsung-s21-ultra',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S21 Ultra',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1252,
      pixelHeight: 2268,
      mmWidth: 106.00,
      mmHeight: 192.02,
      inchWidth: 4.17,
      inchHeight: 7.56,
    },
    cameraCutout: {
      type: 'floating-ultra',
      position: 'top-left',
      description: 'Contour-cut camera housing wrapping the frame with quad lenses and laser AF',
      aspectRatio: 1252 / 2268,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.44,
      cutoutHeightPercent: 0.32,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1252,
            "height": 2268
      },
      "clear": {
            "width": 821,
            "height": 1878
      },
      "wallet": {
            "width": 2279,
            "height": 2115
      },
      "snap": {
            "width": 1252,
            "height": 2268
      },
      "flexi": {
            "width": 900,
            "height": 1973
      }
},
  },
  {
    id: 'samsung-s21-plus',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S21 Plus',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1276,
      pixelHeight: 2243,
      mmWidth: 108.03,
      mmHeight: 189.91,
      inchWidth: 4.25,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Contour-cut camera housing flush with top-left edge',
      aspectRatio: 1276 / 2243,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.28,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1276,
            "height": 2243
      },
      "clear": {
            "width": 809,
            "height": 1836
      },
      "wallet": {
            "width": 2268,
            "height": 2102
      },
      "eco-friendly": {
            "width": 879,
            "height": 1920
      },
      "snap": {
            "width": 1252,
            "height": 2220
      },
      "flexi": {
            "width": 910,
            "height": 1946
      }
},
  },
  {
    id: 'samsung-s21',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S21',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1205,
      pixelHeight: 2079,
      mmWidth: 102.02,
      mmHeight: 176.02,
      inchWidth: 4.02,
      inchHeight: 6.93,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Contour-cut camera housing flush with edge with flash notch cutout',
      aspectRatio: 1205 / 2079,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.28,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1205,
            "height": 2079
      },
      "clear": {
            "width": 757,
            "height": 1719
      },
      "wallet": {
            "width": 2197,
            "height": 1972
      },
      "snap": {
            "width": 1181,
            "height": 2079
      },
      "flexi": {
            "width": 864,
            "height": 1826
      }
},
  },
  {
    id: 'samsung-s21-fe',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S21 FE',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1252,
      pixelHeight: 2161,
      mmWidth: 106.00,
      mmHeight: 182.96,
      inchWidth: 4.17,
      inchHeight: 7.20,
    },
    cameraCutout: {
      type: 'floating-vertical',
      position: 'top-left',
      description: 'Contour-cut triple camera housing flush with edge',
      aspectRatio: 1252 / 2161,
      cornerCurvature: 'sharp',
      cutoutWidthPercent: 0.24,
      cutoutHeightPercent: 0.28,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1252,
            "height": 2161
      },
      "snap": {
            "width": 1242,
            "height": 2127
      }
},
  },
  {
    id: 'samsung-s20-ultra',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S20 Ultra',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1252,
      pixelHeight: 2269,
      mmWidth: 106.00,
      mmHeight: 192.11,
      inchWidth: 4.17,
      inchHeight: 7.56,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Large rectangular camera module with quad lenses and periscope zoom banner',
      aspectRatio: 1252 / 2269,
      cornerCurvature: 'tight',
      cutoutWidthPercent: 0.4,
      cutoutHeightPercent: 0.28,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1252,
            "height": 2269
      },
      "eco-friendly": {
            "width": 869,
            "height": 1942
      },
      "snap": {
            "width": 1252,
            "height": 2269
      }
},
  },
  {
    id: 'samsung-s20-plus',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S20+',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1228,
      pixelHeight: 2244,
      mmWidth: 103.97,
      mmHeight: 189.99,
      inchWidth: 4.09,
      inchHeight: 7.48,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Vertical rectangular rounded camera bump with quad lenses',
      aspectRatio: 1228 / 2244,
      cornerCurvature: 'tight',
      cutoutWidthPercent: 0.32,
      cutoutHeightPercent: 0.26,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1228,
            "height": 2244
      },
      "eco-friendly": {
            "width": 830,
            "height": 1895
      },
      "snap": {
            "width": 1228,
            "height": 2220
      }
},
  },
  {
    id: 'samsung-s20',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S20',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1157,
      pixelHeight: 2102,
      mmWidth: 97.96,
      mmHeight: 177.97,
      inchWidth: 3.86,
      inchHeight: 7.01,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Vertical rectangular rounded camera bump with triple lenses',
      aspectRatio: 1157 / 2102,
      cornerCurvature: 'tight',
      cutoutWidthPercent: 0.3,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1157,
            "height": 2102
      },
      "snap": {
            "width": 1157,
            "height": 2055
      }
},
  },
  {
    id: 'samsung-s20-fe',
    brand: 'samsung',
    modelName: 'Samsung Galaxy S20 FE',
    category: 'Samsung',
    dimensions: {
      resolutionDpi: 300,
      pixelWidth: 1276,
      pixelHeight: 2197,
      mmWidth: 108.03,
      mmHeight: 186.01,
      inchWidth: 4.25,
      inchHeight: 7.32,
    },
    cameraCutout: {
      type: 'square-triple-pro',
      position: 'top-left',
      description: 'Vertical rectangular rounded camera bump with triple lenses and flash',
      aspectRatio: 1276 / 2197,
      cornerCurvature: 'tight',
      cutoutWidthPercent: 0.3,
      cutoutHeightPercent: 0.25,
      safeZoneTopPercent: 35,
    },
    caseFeatures: {
      toughBumper: true,
      raisedBezel: true,
      wrapBleed: true,
    },
    caseTypeDimensions: {
      "tough": {
            "width": 1276,
            "height": 2197
      },
      "snap": {
            "width": 1228,
            "height": 2173
      }
},
  },
];

const findBaseTemplate = (id: string): PrintifyTemplateRef =>
  ALL_PRINTIFY_CATALOG_TEMPLATES.find((t) => t.id === id) || ALL_PRINTIFY_CATALOG_TEMPLATES[0];

/**
 * The 6 strictly designated Printify mockups retrieved and applied during the workflow:
 * 1. Front view, iPhone 18 Pro Max (variant 423468, camera 152213, front)
 * 2. Close-up view, iPhone 16 Pro Max (variant 112813, camera 106399, close-up)
 * 3. Standard view, iPhone 16 Pro Max (variant 112813, camera 106403, layers)
 * 4. Context view 1, iPhone 11 (variant 62582, camera 97553, context-1)
 * 5. Samsung Galaxy S24 (variant 105527, camera 102321, close-up-2)
 * 6. Front view, Samsung Galaxy S26 (variant 254190, camera 128128, front)
 */
export const DESIGNATED_6_PRINTIFY_MOCKUPS: PrintifyTemplateRef[] = [
  {
    ...findBaseTemplate('iphone-18-pro-max'),
    id: 'front-iphone-18-pro-max',
    modelName: 'Front view, iPhone 18 Pro Max',
    variantId: 423468,
    cameraId: 152213,
    cameraLabel: 'front',
  },
  {
    ...findBaseTemplate('iphone-16-pro-max'),
    id: 'closeup-iphone-16-pro-max',
    modelName: 'Close-up view, iPhone 16 Pro Max',
    variantId: 112813,
    cameraId: 106399,
    cameraLabel: 'close-up',
  },
  {
    ...findBaseTemplate('iphone-16-pro-max'),
    id: 'standard-iphone-16-pro-max',
    modelName: 'Standard view, iPhone 16 Pro Max',
    variantId: 112813,
    cameraId: 106403,
    cameraLabel: 'layers',
  },
  {
    ...findBaseTemplate('iphone-11'),
    id: 'context-1-iphone-11',
    modelName: 'Context view 1, iPhone 11',
    variantId: 62582,
    cameraId: 97553,
    cameraLabel: 'context-1',
  },
  {
    ...findBaseTemplate('samsung-s24'),
    id: 'samsung-galaxy-s24',
    modelName: 'Samsung Galaxy S24',
    variantId: 105527,
    cameraId: 102321,
    cameraLabel: 'close-up-2',
  },
  {
    ...findBaseTemplate('samsung-s26'),
    id: 'front-samsung-galaxy-s26',
    modelName: 'Front view, Samsung Galaxy S26',
    variantId: 254190,
    cameraId: 128128,
    cameraLabel: 'front',
  },
];

export const PRINTIFY_TEMPLATES: PrintifyTemplateRef[] = DESIGNATED_6_PRINTIFY_MOCKUPS;

/**
 * Finds a template by its slug ID or modelName across both the 6 designated mockups and full catalog
 */
export function getPrintifyTemplate(idOrName: string): PrintifyTemplateRef | undefined {
  const query = idOrName.toLowerCase().trim();
  return (
    DESIGNATED_6_PRINTIFY_MOCKUPS.find(
      (t) => t.id.toLowerCase() === query || t.modelName.toLowerCase() === query
    ) ||
    ALL_PRINTIFY_CATALOG_TEMPLATES.find(
      (t) => t.id.toLowerCase() === query || t.modelName.toLowerCase() === query
    )
  );
}

/**
 * Retrieves exact print area pixel dimensions for a given model and case style
 */
export function getPrintAreaForModel(
  modelName: string,
  caseType?: CaseType
): { pixelWidth: number; pixelHeight: number } {
  const template = getPrintifyTemplate(modelName) || PRINTIFY_TEMPLATES[0];
  if (caseType && template.caseTypeDimensions && template.caseTypeDimensions[caseType]) {
    const d = template.caseTypeDimensions[caseType]!;
    return {
      pixelWidth: d.pixelWidth ?? d.width ?? template.dimensions.pixelWidth,
      pixelHeight: d.pixelHeight ?? d.height ?? template.dimensions.pixelHeight,
    };
  }
  return {
    pixelWidth: template.dimensions.pixelWidth,
    pixelHeight: template.dimensions.pixelHeight,
  };
}

/**
 * Returns formatted camera cutout guidance and character safe zone recommendations
 */
export function getPrintCutoutDescription(modelName: string, caseType?: CaseType): string {
  const template = getPrintifyTemplate(modelName) || PRINTIFY_TEMPLATES[0];
  const safeZone = 'Keep primary character faces and key typography below top 35% safe-zone to prevent camera occlusion.';
  return `${template.modelName}: ${template.cameraCutout.description}. ${safeZone}`;
}

