import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { parse as parseDate, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { generateChatResponse } from './gemini';
import { logger } from './logger';

// Unified trade schema for validation
const UnifiedTradeSchema = z.object({
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
  
  // Additional broker-specific fields
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

export type UnifiedParsedTrade = z.infer<typeof UnifiedTradeSchema>;

export interface UnifiedParseResult {
  trades: UnifiedParsedTrade[];
  totalRows: number;
  validRows: number;
  errors: string[];
  fileType: string;
  brokerDetected?: string;
  columnMapping?: Record<string, string>;
}

// Comprehensive column mappings for different brokers and formats
const COLUMN_MAPPINGS = {
  tradeId: [
    'trade_id', 'tradeid', 'trade id', 'trade_no', 'trade_number', 'trade number',
    'order_no', 'order_number', 'order number', 'order_id', 'order id',
    'ref_no', 'reference_no', 'settlement_id', 'transaction_id'
  ],
  date: [
    'date', 'trade_date', 'transaction_date', 'settlement_date', 'order_date',
    'execution_date', 'trade date', 'transaction date', 'order date'
  ],
  time: [
    'time', 'trade_time', 'transaction_time', 'order_time', 'execution_time',
    'trade time', 'transaction time', 'order time', 'timestamp'
  ],
  symbol: [
    'symbol', 'scrip', 'script', 'instrument', 'tradingsymbol', 'trading_symbol',
    'scrip_name', 'instrument_name', 'script_name', 'scrip_code', 'stock', 
    'security', 'instrument_token', 'isin_code'
  ],
  tradeType: [
    'trade_type', 'tradetype', 'trade type', 'buy_sell', 'buy_sell_type',
    'transaction_type', 'order_type', 'side', 'action', 'type', 'buy/sell',
    'transaction type', 'b/s', 'bs', 'direction'
  ],
  entryPrice: [
    'entry_price', 'buy_price', 'rate', 'price', 'trade_price', 'avg_price',
    'execution_price', 'average price', 'average_price', 'buy rate', 'purchase_price'
  ],
  exitPrice: [
    'exit_price', 'sell_price', 'rate', 'price', 'trade_price', 'avg_price',
    'execution_price', 'average price', 'average_price', 'sell rate', 'sale_price'
  ],
  quantity: [
    'quantity', 'qty', 'trade_qty', 'trade_quantity', 'filled_qty', 'executed_qty',
    'shares', 'units', 'lot_size', 'volume', 'size'
  ],
  commission: [
    'commission', 'brokerage', 'charges', 'total_charges', 'brok', 'fees',
    'transaction charges', 'transaction_charges', 'total_fees', 'cost'
  ],
  profitLoss: [
    'pnl', 'profit_loss', 'profit/loss', 'p&l', 'net_amount', 'realized_pnl',
    'net_pnl', 'net profit', 'net_profit', 'gain_loss', 'pl'
  ],
  exchange: [
    'exchange', 'exchange_name', 'exchseg', 'segment', 'market', 'exchange_code'
  ],
  productType: [
    'product', 'product_type', 'product type', 'product_code', 'category',
    'instrument_type', 'order_product_type'
  ]
};

// Indian broker detection patterns
const BROKER_PATTERNS = {
  zerodha: ['tradingsymbol', 'instrument', 'qty', 'price', 'trade_date', 'trade_time'],
  angelone: ['scrip_name', 'token', 'trade_no', 'exchange_name', 'segment'],
  upstox: ['symbol', 'series', 'trade_price', 'trade_quantity', 'trade_value'],
  icicidirect: ['script_name', 'buy_sell', 'trade_price', 'trade_qty', 'settlement_id'],
  fivepaisa: ['exchseg', 'series', 'symbol', 'qty', 'rate', 'value'],
  groww: ['instrument_name', 'exchange', 'qty', 'price', 'order_time'],
  hdfc: ['scrip_code', 'scrip_name', 'buy_sell_type', 'quantity', 'rate'],
  kotak: ['symbol', 'trade_date', 'trade_time', 'buy_sell', 'quantity', 'price']
};

/**
 * Main function to parse various file formats (CSV, XLSX, XLS)
 */
export async function parseUnifiedFile(file: File): Promise<UnifiedParseResult> {
  const errors: string[] = [];
  const trades: UnifiedParsedTrade[] = [];
  
  try {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const fileType = fileExtension || 'unknown';
    
    // Validate file type
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      throw new Error('Unsupported file format. Please upload CSV, XLSX, or XLS files.');
    }

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File size must be less than 20MB');
    }

    let records: Record<string, unknown>[] = [];
    let headers: string[] = [];

    // Parse file based on type
    if (fileExtension === 'csv') {
      records = await parseCSVContent(file);
    } else if (fileExtension && ['xlsx', 'xls'].includes(fileExtension)) {
      records = await parseExcelContent(file);
    }

    if (records.length === 0) {
      throw new Error('No data found in file');
    }

    headers = Object.keys(records[0]);
    logger.debug('File headers detected', { headers, recordCount: records.length });

    // Detect broker if possible
    const brokerDetected = detectBroker(headers);
    logger.debug('Broker detection result', { brokerDetected });

    // Use AI to intelligently map columns if API key is available
    let columnMapping: Record<string, string> | null = null;
    try {
      if (process.env.GOOGLE_API_KEY) {
        columnMapping = await getColumnMappingFromAI(headers, JSON.stringify(records.slice(0, 3)));
        logger.debug('AI column mapping successful', { columnMapping });
      }
    } catch (error) {
      logger.warn('AI column mapping failed, using fallback', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Apply fallback mapping if AI fails
    const finalMapping = columnMapping || createFallbackMapping(headers);
    logger.debug('Final column mapping', { finalMapping, mappingSource: columnMapping ? 'AI' : 'fallback' });

    // Process each record
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        const mappedTrade = mapRecordToTrade(record, finalMapping, i + 1);
        
        if (mappedTrade) {
          const validatedTrade = UnifiedTradeSchema.parse(mappedTrade);
          trades.push(validatedTrade);
        }
      } catch (error) {
        const errorMessage = `Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data format'}`;
        errors.push(errorMessage);
      }
    }

    return {
      trades,
      totalRows: records.length,
      validRows: trades.length,
      errors,
      fileType,
      brokerDetected,
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

/**
 * Parse CSV file content
 */
async function parseCSVContent(file: File): Promise<Record<string, unknown>[]> {
  const csvContent = await file.text();
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false,
  });
}

/**
 * Parse Excel file content (XLSX, XLS)
 */
async function parseExcelContent(file: File): Promise<Record<string, unknown>[]> {
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
  const headers = jsonData[0] as string[];
  
  if (!headers || headers.length === 0) {
    throw new Error('No headers found in Excel file');
  }
  
  // Convert remaining rows to objects
  return jsonData.slice(1).map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  }).filter(row => Object.values(row).some(val => val !== ''));
}

/**
 * Use AI to intelligently map columns
 */
async function getColumnMappingFromAI(headers: string[], sampleData: string): Promise<Record<string, string> | null> {
  try {
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
  "productType": "actual_column_name_or_null"
}

Guidelines:
- Trade ID: Look for unique identifiers like order numbers, trade numbers, reference numbers
- Symbol: Stock/instrument names or codes
- Type: Buy/Sell indicators, transaction types
- Price: Trading prices, rates, average prices
- Date/Time: Transaction dates and times
- Return exact column names as they appear in the headers.`;

    const response = await generateChatResponse(prompt, { hasData: false, totalTrades: 0, totalNetProfitLoss: 0, winRate: 0, avgProfitLoss: 0 }, '');
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      logger.warn('Failed to parse AI response as JSON', { parseError: parseError instanceof Error ? parseError.message : 'Unknown error' });
    }
    
    return null;
  } catch (error) {
    logger.error('AI column mapping error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
}

/**
 * Create fallback column mapping using pattern matching
 */
function createFallbackMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const [field, patterns] of Object.entries(COLUMN_MAPPINGS)) {
    const normalizedPatterns = patterns.map(p => p.toLowerCase());
    
    for (const pattern of normalizedPatterns) {
      const index = normalizedHeaders.findIndex(h => 
        h === pattern || h.includes(pattern) || pattern.includes(h)
      );
      
      if (index !== -1) {
        mapping[field] = headers[index];
        break;
      }
    }
  }
  
  return mapping;
}

/**
 * Detect broker based on column patterns
 */
function detectBroker(headers: string[]): string | undefined {
  const normalizedHeaders = headers.map(h => h.toLowerCase());
  
  for (const [broker, patterns] of Object.entries(BROKER_PATTERNS)) {
    const matches = patterns.filter(pattern => 
      normalizedHeaders.some(header => header.includes(pattern.toLowerCase()))
    );
    
    if (matches.length >= 2) {
      return broker;
    }
  }
  
  return undefined;
}

/**
 * Map record to trade using column mapping
 */
function mapRecordToTrade(
  record: Record<string, unknown>, 
  mapping: Record<string, string>, 
  rowNumber: number
): UnifiedParsedTrade | null {
  try {
    // Extract values using mapping
    const getValue = (field: string): string | null => {
      const columnName = mapping[field];
      if (!columnName || !record[columnName]) return null;
      return String(record[columnName]).trim();
    };

    const symbol = getValue('symbol');
    const tradeType = getValue('tradeType');
    const quantity = getValue('quantity');
    
    if (!symbol || !tradeType || !quantity) {
      throw new Error(`Missing required fields: symbol=${!!symbol}, tradeType=${!!tradeType}, quantity=${!!quantity}`);
    }

    // Parse date
    const dateStr = getValue('date');
    if (!dateStr) {
      throw new Error('Date is required');
    }
    
    const parsedDate = parseTradeDate(dateStr);

    // Parse numeric values safely
    const parseNumber = (value: string | null, defaultValue = 0): number => {
      if (value === null || value === undefined || value === '') return defaultValue;
      const parsed = parseFloat(value.replace(/[,₹$]/g, ''));
      return isNaN(parsed) ? defaultValue : parsed;
    };

    const parsedQuantity = parseNumber(quantity);
    if (parsedQuantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Handle price mapping
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

    entryPrice = price;
    exitPrice = price;

    // Calculate P&L if available
    const pnlValue = getValue('profitLoss');
    const profitLoss = pnlValue ? parseNumber(pnlValue) : 0;

    // Normalize trade type
    const tradeTypeStr = tradeType.toString().toUpperCase().trim();
    let normalizedTradeType: string;
    
    if (['B', 'BUY'].includes(tradeTypeStr) || tradeTypeStr.includes('BUY')) {
      normalizedTradeType = 'BUY';
    } else if (['S', 'SELL'].includes(tradeTypeStr) || tradeTypeStr.includes('SELL')) {
      normalizedTradeType = 'SELL';
    } else {
      throw new Error(`Invalid trade type: ${tradeTypeStr}. Must be BUY, SELL, B, or S`);
    }

    const trade: UnifiedParsedTrade = {
      tradeId: getValue('tradeId') || `T${rowNumber}_${Date.now()}`,
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
      duration: parseNumber(getValue('duration'), undefined) || undefined,
    };

    return trade;
  } catch (error) {
    throw new Error(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse date from various formats
 */
function parseTradeDate(dateStr: string): Date {
  const cleaned = dateStr.trim();
  
  // Common date formats
  const formats = [
    'yyyy-MM-dd',
    'dd-MM-yyyy', 
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'yyyy/MM/dd',
    'dd-MMM-yyyy',
    'MMM dd, yyyy'
  ];
  
  const referenceDate = new Date();
  
  for (const format of formats) {
    try {
      const parsed = parseDate(cleaned, format, referenceDate);
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  
  // Fallback to basic Date parsing
  const fallbackDate = new Date(cleaned);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }
  
  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * Validate CSV headers against expected format
 */
export function validateHeaders(headers: string[]): { isValid: boolean; missingHeaders: string[] } {
  const requiredFields = ['symbol', 'tradeType', 'quantity'];
  const normalizedHeaders = headers.map(h => h.toLowerCase());
  const missingHeaders: string[] = [];
  
  for (const field of requiredFields) {
    const patterns = COLUMN_MAPPINGS[field as keyof typeof COLUMN_MAPPINGS] || [];
    const found = patterns.some(pattern => 
      normalizedHeaders.some(header => 
        header.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(header)
      )
    );
    
    if (!found) {
      missingHeaders.push(field);
    }
  }
  
  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
  };
} 