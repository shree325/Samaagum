export const INDIA_GEOJSON: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "India" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [68.1, 23.3], [73.5, 25.8], [74.2, 31.1], [74.9, 35.5], [77.2, 35.5],
          [77.9, 32.2], [80.5, 30.5], [81.3, 30.1], [81.8, 27.9], [84.1, 27.5],
          [85.3, 26.8], [88.1, 27.2], [88.5, 27.9], [91.6, 27.8], [91.9, 29.3],
          [96.0, 29.4], [97.3, 27.8], [96.1, 25.2], [93.2, 23.5], [92.2, 20.8],
          [88.2, 21.6], [85.8, 19.8], [84.8, 16.8], [80.2, 12.8], [77.5, 8.1],
          [76.9, 8.4], [75.1, 12.0], [73.8, 15.5], [72.8, 18.9], [72.1, 22.3],
          [68.5, 22.8], [68.1, 23.3]
        ]]
      }
    }
  ]
};

export const WORLD_GEOJSON: any = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-168.0, 65.0], [-100.0, 75.0], [-50.0, 60.0], [-80.0, 25.0], [-100.0, 15.0],
          [-120.0, 35.0], [-168.0, 65.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "South America" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-80.0, 10.0], [-35.0, -5.0], [-40.0, -20.0], [-70.0, -55.0], [-75.0, -40.0],
          [-80.0, -10.0], [-80.0, 10.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Eurasia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-10.0, 40.0], [20.0, 35.0], [30.0, 40.0], [40.0, 60.0], [60.0, 80.0],
          [170.0, 80.0], [170.0, 20.0], [120.0, 10.0], [80.0, 5.0], [40.0, 15.0],
          [35.0, 30.0], [15.0, 35.0], [-10.0, 40.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-15.0, 35.0], [30.0, 30.0], [50.0, 10.0], [45.0, -25.0], [35.0, -35.0],
          [10.0, -30.0], [-10.0, 5.0], [-15.0, 15.0], [-15.0, 35.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Australia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [113.0, -25.0], [153.0, -15.0], [150.0, -35.0], [115.0, -35.0], [113.0, -25.0]
        ]]
      }
    }
  ]
};
