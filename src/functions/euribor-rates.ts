export interface EuriborRates {
  id?: string;
  date?: string;

  // For storing Euribor 1 week (1W)
  W1?: number;
  W1Prev?: number;

  // For storing Euribor 1 month (1M)
  M1?: number;
  M1Prev?: number;

  // For storing Euribor 3 months (3M)
  M3?: number;
  M3Prev?: number;

  // For storing Euribor 6 months (6M)
  M6?: number;
  M6Prev?: number;

  // For storing Euribor 12 months (12M)
  M12?: number;
  M12Prev?: number;
}
