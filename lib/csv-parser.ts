import { parse } from 'csv-parse';
import { z } from 'zod';

// Define the schema for trade data validation
const TradeSchema = z.object({
  TradeID: z.string().min(1, "TradeID is required"),
  Date: z.string().refine((date) => {
    // Support both YYYY-MM-DD and MM/DD/YYYY formats
    const date1 = new Date(date);
    const date2 = new Date(date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'));
    return !isNaN(date1.getTime()) || !isNaN(date2.getTime());
  }, "Invalid date format"),
  Time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be in HH:MM:SS format"),
  Symbol: z.string().min(1, "Symbol is required"),
  TradeType: z.enum(['Buy', 'Sell', 'Long', 'Short'], {
    errorMap: () => ({ message: "TradeType must be Buy, Sell, Long, or Short" })
  }),
  EntryPrice: z.string().refine((val) => !isNaN(parseFloat(val)), "EntryPrice must be a number"),
  ExitPrice: z.string().refine((val) => !isNaN(parseFloat(val)), "ExitPrice must be a number"),
  Quantity: z.string().refine((val) => !isNaN(parseInt(val)), "Quantity must be a number"),
  Commission: z.string().optional().default("0"),
  ProfitLoss: z.string().refine((val) => !isNaN(parseFloat(val)), "ProfitLoss must be a number"),
  Duration: z.string().optional()
});

export type TradeData = z.infer<typeof TradeSchema>;

export interface ParsedTrade {
  tradeId: string;
  date: Date;
  time: string;
  symbol: string;
  tradeType: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  commission: number;
  profitLoss: number;
  duration?: number;
}

export interface CSVParseResult {
  trades: ParsedTrade[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export function parseCSV(csvContent: string): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    const trades: ParsedTrade[] = [];
    const errors: string[] = [];
    let totalRows = 0;
    let validRows = 0;

    parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }, (err, records) => {
      if (err) {
        resolve({
          trades: [],
          errors: [`CSV parsing error: ${err.message}`],
          totalRows: 0,
          validRows: 0
        });
        return;
      }

      totalRows = records.length;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowIndex = i + 2; // +2 because CSV has headers and arrays are 0-indexed

        try {
          // Validate the record
          const validatedRecord = TradeSchema.parse(record);
          
          // Convert and process the data
          const trade: ParsedTrade = {
            tradeId: validatedRecord.TradeID,
            date: parseDate(validatedRecord.Date),
            time: validatedRecord.Time,
            symbol: validatedRecord.Symbol.toUpperCase(),
            tradeType: validatedRecord.TradeType,
            entryPrice: parseFloat(validatedRecord.EntryPrice),
            exitPrice: parseFloat(validatedRecord.ExitPrice),
            quantity: parseInt(validatedRecord.Quantity),
            commission: parseFloat(validatedRecord.Commission || "0"),
            profitLoss: parseFloat(validatedRecord.ProfitLoss),
            duration: validatedRecord.Duration ? parseInt(validatedRecord.Duration) : undefined
          };

          trades.push(trade);
          validRows++;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            errors.push(`Row ${rowIndex}: ${fieldErrors.join(', ')}`);
          } else {
            errors.push(`Row ${rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      resolve({
        trades,
        errors,
        totalRows,
        validRows
      });
    });
  });
}

function parseDate(dateString: string): Date {
  // Try YYYY-MM-DD format first
  let date = new Date(dateString);
  
  // If that fails, try MM/DD/YYYY format
  if (isNaN(date.getTime())) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // MM/DD/YYYY -> YYYY-MM-DD
      date = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
    }
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  return date;
}

export function validateCSVHeaders(headers: string[]): { isValid: boolean; missingHeaders: string[] } {
  const requiredHeaders = ['TradeID', 'Date', 'Time', 'Symbol', 'TradeType', 'EntryPrice', 'ExitPrice', 'Quantity', 'ProfitLoss'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
  };
} 