import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { parse as parseDate, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { model } from './gemini';

// Enhanced trade schema for validation
const EnhancedTradeSchema = z.object({
  tradeId: z.string(),
  date: z.date(),
  time: z.string(),
  symbol: z.string(),
  tradeType: z.string(),
  entryPrice: z.number(),
  exitPrice: z.number(),
  quantity: z.number(),
  commission: z.number().default(0),
  profitLoss: z.number(),
  duration: z.number().optional(),
  
  // Additional fields
  exchange: z.string().optional(),
  productType: z.string().optional(),
  isin: z.string().optional(),
  brokerage: z.number().optional(),
  ett: z.number().optional(),
  gst: z.number().optional(),
  stt: z.number().optional(),
  sebi: z.number().optional(),
  stampDuty: z.number().optional(),
  orderNumber: z.string().optional(),
  tradeNumber: z.string().optional(),
});

export type EnhancedParsedTrade = z.infer<typeof EnhancedTradeSchema>;

export interface UniversalParseResult {
  trades: EnhancedParsedTrade[];
  totalRows: number;
  validRows: number;
  errors: string[];
  fileType: string;
  columnMapping?: Record<string, string>;
}

// Standard column mappings for TradePulse
const STANDARD_COLUMNS = {
  tradeId: ['trade_id', 'trade id', 'tradeid', 'trade_no', 'order_no', 'ref_no', 'settlement_id', 'order_number', 'trade_number', 'trade number', 'order id'],
  date: ['date', 'trade_date', 'transaction_date', 'settlement_date', 'order_date', 'execution_date', 'trade date'],
  time: ['time', 'trade_time', 'transaction_time', 'order_time', 'execution_time', 'trade time', 'order time'],
  symbol: ['symbol', 'scrip', 'script', 'instrument', 'tradingsymbol', 'scrip_name', 'instrument_name', 'script_name', 'scrip_code', 'stock', 'security'],
  tradeType: ['trade_type', 'trade type', 'buy_sell', 'buy_sell_type', 'transaction_type', 'order_type', 'side', 'action', 'type', 'buy/sell', 'transaction type', 'b/s', 'bs'],
  entryPrice: ['entry_price', 'buy_price', 'rate', 'price', 'trade_price', 'avg_price', 'execution_price', 'average price'],
  exitPrice: ['exit_price', 'sell_price', 'rate', 'price', 'trade_price', 'avg_price', 'execution_price', 'average price'],
  quantity: ['quantity', 'qty', 'trade_qty', 'trade_quantity', 'filled_qty', 'executed_qty', 'shares', 'units'],
  commission: ['commission', 'brokerage', 'charges', 'total_charges', 'brok', 'fees', 'transaction charges'],
  profitLoss: ['pnl', 'profit_loss', 'net_amount', 'realized_pnl', 'net_pnl', 'p&l', 'profit/loss', 'net profit'],
  exchange: ['exchange', 'exchange_name', 'exchseg', 'segment', 'market'],
  productType: ['product', 'product_type', 'order_type', 'product_code', 'product type', 'category'],
  isin: ['isin', 'isin_code', 'isin code'],
  brokerage: ['brokerage', 'brok', 'commission', 'broker charges'],
  ett: ['ett', 'exchange_transaction_tax', 'exchange transaction tax'],
  gst: ['gst', 'service_tax', 'tax', 'goods and services tax'],
  stt: ['stt', 'securities_transaction_tax', 'securities transaction tax'],
  sebi: ['sebi', 'sebi_charges', 'regulatory_fee', 'sebi charges'],
  stampDuty: ['stamp_duty', 'stamp_charges', 'stamp', 'stamp duty'],
  orderNumber: ['order_number', 'order_no', 'order_id', 'order number', 'order id'],
  tradeNumber: ['trade_number', 'trade_no', 'trade_id', 'trade number', 'trade id']
};

export async function parseUniversalFile(file: File): Promise<UniversalParseResult> {
  const errors: string[] = [];
  const trades: EnhancedParsedTrade[] = [];
  
  try {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const fileType = fileExtension || 'unknown';
    
    let records: Record<string, unknown>[] = [];
    let headers: string[] = [];

    // Parse file based on type
    console.log('Parsing file type:', fileExtension);
    
    if (fileExtension === 'csv') {
      try {
        const csvContent = await file.text();
        records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          cast: false,
        });
        headers = records.length > 0 ? Object.keys(records[0]) : [];
        console.log('CSV parsing successful, records:', records.length);
      } catch (error) {
        throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No worksheets found in Excel file');
        }
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (jsonData.length === 0) {
          throw new Error('No data found in Excel file');
        }
        
        // First row as headers
        headers = jsonData[0] as string[];
        
        if (!headers || headers.length === 0) {
          throw new Error('No headers found in Excel file');
        }
        
        // Convert remaining rows to objects
        records = jsonData.slice(1).map((row: unknown[]) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        }).filter(row => Object.values(row).some(val => val !== ''));
        
        console.log('Excel parsing successful, records:', records.length);
      } catch (error) {
        throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      throw new Error('Unsupported file format. Please upload CSV, XLSX, or XLS files.');
    }

    if (records.length === 0) {
      throw new Error('No data found in file');
    }

    console.log('File headers detected:', headers);

    // Use AI to intelligently map columns
    let columnMapping = null;
    try {
      columnMapping = await getColumnMappingFromAI(headers, JSON.stringify(records.slice(0, 3)));
      console.log('AI Column Mapping:', columnMapping);
    } catch (error) {
      console.log('AI column mapping failed, using fallback:', error);
    }

    // Apply fallback mapping if AI fails
    const finalMapping = columnMapping || createFallbackMapping(headers);
    console.log('Final mapping:', finalMapping);
    console.log('Headers found:', headers);
    console.log('Sample record:', records[0]);

    // Process each record
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        const mappedTrade = mapRecordToTrade(record, finalMapping, i + 1);
        
        if (mappedTrade) {
          // Validate the trade
          const validatedTrade = EnhancedTradeSchema.parse(mappedTrade);
          trades.push(validatedTrade);
        }
      } catch (error) {
        const errorMessage = `Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data format'}`;
        errors.push(errorMessage);
        console.log('Row parsing error:', errorMessage);
      }
    }

    return {
      trades,
      totalRows: records.length,
      validRows: trades.length,
      errors,
      fileType,
      columnMapping: finalMapping
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    errors.push(`File parsing failed: ${errorMessage}`);
    
    return {
      trades: [],
      totalRows: 0,
      validRows: 0,
      errors,
      fileType: 'unknown',
    };
  }
}

async function getColumnMappingFromAI(headers: string[], sampleData: string): Promise<Record<string, string> | null> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.log('No Google API key found, skipping AI column mapping');
      return null;
    }

    const prompt = `You are an expert in trading and financial data analysis. Analyze the following headers and sample data from a trading file, then map them to our standard format.

Headers: ${headers.join(', ')}

Sample Data (first few rows):
${sampleData}

Map these columns to our standard format. Return ONLY a JSON object with the mapping, no other text:

Required mappings (use null if column doesn't exist):
{
  "tradeId": "actual_column_name_or_null",
  "date": "actual_column_name_or_null", 
  "time": "actual_column_name_or_null",
  "symbol": "actual_column_name_or_null",
  "tradeType": "actual_column_name_or_null",
  "entryPrice": "actual_column_name_or_null",
  "exitPrice": "actual_column_name_or_null", 
  "quantity": "actual_column_name_or_null",
  "commission": "actual_column_name_or_null",
  "profitLoss": "actual_column_name_or_null",
  "exchange": "actual_column_name_or_null",
  "productType": "actual_column_name_or_null",
  "isin": "actual_column_name_or_null",
  "brokerage": "actual_column_name_or_null",
  "ett": "actual_column_name_or_null",
  "gst": "actual_column_name_or_null", 
  "stt": "actual_column_name_or_null",
  "sebi": "actual_column_name_or_null",
  "stampDuty": "actual_column_name_or_null",
  "orderNumber": "actual_column_name_or_null",
  "tradeNumber": "actual_column_name_or_null"
}

Guidelines:
- Trade ID: Look for unique identifiers like order numbers, trade numbers, reference numbers
- Symbol: Stock/instrument names or codes
- Type: Buy/Sell indicators, transaction types
- Price: Trading prices, rates, average prices
- Date/Time: Transaction dates and times
- Charges: Brokerage, commission, fees, taxes
- For price mapping, if separate buy/sell prices exist, map accordingly. If only one price column, map to entryPrice.
- Return exact column names as they appear in the headers.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const mapping = JSON.parse(jsonMatch[0]);
      
      // Validate mapping has required fields
      const requiredFields = ['symbol', 'tradeType', 'quantity'];
      const hasRequiredFields = requiredFields.some(field => mapping[field] && mapping[field] !== 'null');
      
      if (hasRequiredFields) {
        return mapping;
      }
    }

    return null;
  } catch (error) {
    console.error('AI column mapping failed:', error);
    return null;
  }
}

function createFallbackMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const [standardColumn, variations] of Object.entries(STANDARD_COLUMNS)) {
    const matchedHeader = headers.find(header => 
      variations.some(variation => 
        header.toLowerCase().includes(variation.toLowerCase()) ||
        variation.toLowerCase().includes(header.toLowerCase())
      )
    );
    
    if (matchedHeader) {
      mapping[standardColumn] = matchedHeader;
    }
  }
  
  return mapping;
}

function mapRecordToTrade(record: Record<string, unknown>, mapping: Record<string, string>, rowNumber: number): EnhancedParsedTrade | null {
  try {
    // Extract values using mapping
    const getValue = (field: string): string | null => {
      const columnName = mapping[field];
      if (!columnName || !record[columnName]) return null;
      return String(record[columnName]);
    };

    const symbol = getValue('symbol');
    const tradeType = getValue('tradeType');
    const quantity = getValue('quantity');
    
    console.log(`Row ${rowNumber} parsing:`, { symbol, tradeType, quantity });
    
    if (!symbol || !tradeType || !quantity) {
      throw new Error(`Missing required fields: symbol=${!!symbol}, tradeType=${!!tradeType}, quantity=${!!quantity}`);
    }

    // Parse date
    const dateStr = getValue('date');
    if (!dateStr) {
      throw new Error('Date is required');
    }
    
    let parsedDate: Date;
    try {
      parsedDate = new Date(dateStr);
      if (!isValid(parsedDate)) {
        // Try different date formats
        const formats = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'MM-dd-yyyy'];
        for (const format of formats) {
          try {
            parsedDate = parseDate(dateStr, format, new Date());
            if (isValid(parsedDate)) break;
          } catch {
            continue;
          }
        }
      }
      if (!isValid(parsedDate)) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
    } catch {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Parse numeric values
    const parseNumber = (value: string | null, defaultValue = 0): number => {
      if (value === null || value === undefined || value === '') return defaultValue;
      const parsed = parseFloat(value.replace(/[,₹$]/g, ''));
      return isNaN(parsed) ? defaultValue : parsed;
    };

    const parsedQuantity = parseNumber(quantity);
    if (parsedQuantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Handle price mapping based on trade type
    let entryPrice = 0;
    let exitPrice = 0;
    
    const priceValue = getValue('entryPrice') || getValue('exitPrice');
    if (!priceValue) {
      throw new Error('Price is required');
    }
    
    const price = parseNumber(priceValue);
    if (price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    // For individual trades, we'll use the same price for both entry and exit
    // The trade matching logic will handle the actual matching
    entryPrice = price;
    exitPrice = price;

    // Calculate P&L if available, otherwise set to 0
    const pnlValue = getValue('profitLoss');
    const profitLoss = pnlValue ? parseNumber(pnlValue) : 0;

    // Normalize trade type - handle various formats
    const tradeTypeStr = tradeType.toString().toUpperCase().trim();
    let normalizedTradeType: string;
    
    if (tradeTypeStr === 'B' || tradeTypeStr === 'BUY' || tradeTypeStr.includes('BUY')) {
      normalizedTradeType = 'BUY';
    } else if (tradeTypeStr === 'S' || tradeTypeStr === 'SELL' || tradeTypeStr.includes('SELL')) {
      normalizedTradeType = 'SELL';
    } else {
      throw new Error(`Invalid trade type: ${tradeTypeStr}. Must be BUY, SELL, B, or S`);
    }

    const trade: EnhancedParsedTrade = {
      tradeId: getValue('tradeId') || `T${rowNumber}`,
      date: parsedDate,
      time: getValue('time') || '00:00:00',
      symbol: symbol.toString().toUpperCase(),
      tradeType: normalizedTradeType,
      entryPrice,
      exitPrice,
      quantity: parsedQuantity,
      commission: parseNumber(getValue('commission')),
      profitLoss,
      exchange: getValue('exchange') || undefined,
      productType: getValue('productType') || undefined,
      isin: getValue('isin') || undefined,
      brokerage: parseNumber(getValue('brokerage'), undefined),
      ett: parseNumber(getValue('ett'), undefined),
      gst: parseNumber(getValue('gst'), undefined),
      stt: parseNumber(getValue('stt'), undefined),
      sebi: parseNumber(getValue('sebi'), undefined),
      stampDuty: parseNumber(getValue('stampDuty'), undefined),
      orderNumber: getValue('orderNumber') || undefined,
      tradeNumber: getValue('tradeNumber') || undefined,
    };

    return trade;
  } catch (error) {
    throw new Error(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 