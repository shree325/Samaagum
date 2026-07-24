export const getHaversineSQL = (latCol: string, lonCol: string, latParam: string = '$3', lonParam: string = '$4') => `
  (6371 * acos(
    cos(radians(${latParam})) *
    cos(radians(CAST(NULLIF(BTRIM(${latCol}), '') AS FLOAT))) *
    cos(radians(CAST(NULLIF(BTRIM(${lonCol}), '') AS FLOAT)) - radians(${lonParam})) +
    sin(radians(${latParam})) *
    sin(radians(CAST(NULLIF(BTRIM(${latCol}), '') AS FLOAT)))
  ))
`;
