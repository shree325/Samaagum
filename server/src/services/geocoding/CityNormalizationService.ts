export class CityNormalizationService {
  private static readonly ALIASES: Record<string, string> = {
    'bengaluru': 'Bangalore',
    'bangalore': 'Bangalore',
    'gurugram': 'Gurgaon',
    'gurgaon': 'Gurgaon',
    'mumbai': 'Mumbai',
    'bombay': 'Mumbai',
    'kolkata': 'Kolkata',
    'calcutta': 'Kolkata',
    'chennai': 'Chennai',
    'madras': 'Chennai',
    'pune': 'Pune',
    'poona': 'Pune',
    'hyderabad': 'Hyderabad',
    'indore': 'Indore',
    'delhi': 'Delhi',
    'new delhi': 'Delhi'
  };

  public static normalizeCityName(cityName: string | null | undefined): string {
    if (!cityName) return '';
    const clean = cityName.trim().normalize('NFC').toLowerCase();
    return this.ALIASES[clean] || (cityName.trim().charAt(0).toUpperCase() + cityName.trim().slice(1));
  }

  public static normalizeAddressString(address: string): string {
    if (!address) return '';
    return address
      .normalize('NFC')
      .toLowerCase()
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
