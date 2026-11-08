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
  goHome: (instant?: boolean) => Promise<void>;
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

  async goHome(instant?: boolean): Promise<void> {
    if (!activeDriver) return;
    await activeDriver.goHome(instant);
  },
};
