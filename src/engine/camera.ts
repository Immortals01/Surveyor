export interface CameraFlightOptions {
  instant?: boolean;
  altitude?: number;
}

export interface CameraDriver {
  flyToLatLon: (
    lat: number,
    lon: number,
    options?: CameraFlightOptions,
  ) => Promise<void>;
  flyOverview: (
    lat: number,
    lon: number,
    distance?: number,
    instant?: boolean,
  ) => Promise<void>;
  flyEarthrise: (instant?: boolean) => Promise<void>;
  goHome: (instant?: boolean) => Promise<void>;
  zoomIn: (instant?: boolean) => void;
  zoomOut: (instant?: boolean) => void;
  rotateBy: (dAzimuth: number, dPolar: number, instant?: boolean) => void;
}

let activeDriver: CameraDriver | null = null;

export const cameraBus = {
  register(driver: CameraDriver) {
    activeDriver = driver;
    return () => {
      if (activeDriver === driver) {
        activeDriver = null;
      }
    };
  },

  async flyToLatLon(
    lat: number,
    lon: number,
    options?: CameraFlightOptions,
  ): Promise<void> {
    if (!activeDriver) return;
    await activeDriver.flyToLatLon(lat, lon, options);
  },

  async flyOverview(
    lat: number,
    lon: number,
    distance?: number,
    instant?: boolean,
  ): Promise<void> {
    if (!activeDriver) return;
    await activeDriver.flyOverview(lat, lon, distance, instant);
  },

  async flyEarthrise(instant?: boolean): Promise<void> {
    if (!activeDriver) return;
    await activeDriver.flyEarthrise(instant);
  },

  async goHome(instant?: boolean): Promise<void> {
    if (!activeDriver) return;
    await activeDriver.goHome(instant);
  },

  zoomIn(instant?: boolean): void {
    activeDriver?.zoomIn(instant);
  },

  zoomOut(instant?: boolean): void {
    activeDriver?.zoomOut(instant);
  },

  rotateBy(dAzimuth: number, dPolar: number, instant?: boolean): void {
    activeDriver?.rotateBy(dAzimuth, dPolar, instant);
  },
};
