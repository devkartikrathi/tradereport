import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { parse as parseDate, isValid } from 'date-fns';
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
  
  // Additional Indian broker specific fields
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

export interface EnhancedParseResult {
  trades: EnhancedParsedTrade[];
  totalRows: number;
  validRows: number;
  errors: string[];
  brokerDetected?: string;
  columnMapping?: Record<string, string>;
}

// Common Indian broker column variations
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

// Standard column mappings for TradePulse
const STANDARD_COLUMNS = {
  tradeId: ['trade_id', 'tradeid', 'trade_no', 'order_no', 'ref_no', 'settlement_id', 'order_number', 'trade_number', 'trade number'],
  date: ['date', 'trade_date', 'transaction_date', 'settlement_date', 'order_date'],
  time: ['time', 'trade_time', 'transaction_time', 'order_time', 'execution_time', 'trade time'],
  symbol: ['symbol', 'scrip', 'script', 'instrument', 'tradingsymbol', 'scrip_name', 'instrument_name', 'script_name', 'scrip_code'],
  tradeType: ['trade_type', 'buy_sell', 'buy_sell_type', 'transaction_type', 'order_type', 'side', 'action', 'type'],
  entryPrice: ['entry_price', 'buy_price', 'rate', 'price', 'trade_price', 'avg_price', 'execution_price'],
  exitPrice: ['exit_price', 'sell_price', 'rate', 'price', 'trade_price', 'avg_price', 'execution_price'],
  quantity: ['quantity', 'qty', 'trade_qty', 'trade_quantity', 'filled_qty', 'executed_qty'],
  commission: ['commission', 'brokerage', 'charges', 'total_charges', 'brok'],
  profitLoss: ['pnl', 'profit_loss', 'net_amount', 'realized_pnl', 'net_pnl', 'p&l'],
  exchange: ['exchange', 'exchange_name', 'exchseg', 'segment'],
  productType: ['product', 'product_type', 'order_type', 'product_code', 'product type'],
  isin: ['isin', 'isin_code'],
  brokerage: ['brokerage', 'brok', 'commission'],
  ett: ['ett', 'exchange_transaction_tax'],
  gst: ['gst', 'service_tax', 'tax'],
  stt: ['stt', 'securities_transaction_tax'],
  sebi: ['sebi', 'sebi_charges', 'regulatory_fee'],
  stampDuty: ['stamp_duty', 'stamp_charges', 'stamp', 'stamp duty'],
  orderNumber: ['order_number', 'order_no', 'order_id', 'order number'],
  tradeNumber: ['trade_number', 'trade_no', 'trade_id', 'trade number']
};

export async function parseEnhancedCSV(csvContent: string): Promise<EnhancedParseResult> {
  const errors: string[] = [];
  const trades: EnhancedParsedTrade[] = [];
  
  try {
    // Parse CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false, // Keep as strings initially
    });

    if (records.length === 0) {
      throw new Error('No data found in CSV file');
    }

    const headers = Object.keys(records[0]);
    console.log('CSV Headers detected:', headers);

    // Use Gemini AI to intelligently map columns
    const columnMapping = await getColumnMappingFromAI(headers, csvContent.substring(0, 2000));
    console.log('AI Column Mapping:', columnMapping);

    // Detect broker if possible
    const brokerDetected = detectBroker(headers);
    console.log('Broker detected:', brokerDetected);

    // Apply fallback mapping if AI fails
    const finalMapping = columnMapping || createFallbackMapping(headers);

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
      brokerDetected,
      columnMapping: finalMapping
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    errors.push(`CSV parsing failed: ${errorMessage}`);
    
    return {
      trades: [],
      totalRows: 0,
      validRows: 0,
      errors,
    };
  }
}

async function getColumnMappingFromAI(headers: string[], sampleData: string): Promise<Record<string, string> | null> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.log('No Google API key found, skipping AI column mapping');
      return null;
    }

    const prompt = `You are an expert in Indian stock trading and brokerage data formats. Analyze the following CSV headers and sample data from an Indian broker's trading report, then map them to our standard format.

CSV Headers: ${headers.join(', ')}

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

For Indian brokers, common patterns:
- Trade ID: TradeID, Trade Number, Order Number, Ref No
- Symbol: Script, Symbol, Instrument, Trading Symbol
- Type: Buy/Sell, Transaction Type, Product Type
- Price: Rate, Price, Trade Price, Average Price
- Indian charges: STT, ETT, GST, SEBI, Stamp Duty, Brokerage

Return only the JSON mapping:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const mapping = JSON.parse(jsonMatch[0]);
      
      // Validate that the mapping contains reasonable values
      const requiredFields = ['symbol', 'quantity', 'tradeType'];
      const hasRequiredFields = requiredFields.some(field => 
        mapping[field] && mapping[field] !== 'null' && headers.includes(mapping[field])
      );
      
      if (hasRequiredFields) {
        console.log('AI mapping successful:', mapping);
        return mapping;
      }
    }
    
    console.log('AI mapping failed validation, using fallback');
    return null;
    
  } catch (error) {
    console.error('AI column mapping failed:', error);
    return null;
  }
}

function detectBroker(headers: string[]): string | undefined {
  for (const [broker, patterns] of Object.entries(BROKER_PATTERNS)) {
    const matches = patterns.filter(pattern => 
      headers.some(header => header.toLowerCase().includes(pattern.toLowerCase()))
    );
    
    if (matches.length >= 2) {
      return broker;
    }
  }
  
  return undefined;
}

function createFallbackMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  // Create case-insensitive header lookup
  const headerLookup = new Map();
  headers.forEach(header => {
    headerLookup.set(header.toLowerCase().replace(/[^a-z0-9]/g, ''), header);
  });
  
  // Map each standard column to the best matching header
  for (const [standardCol, variations] of Object.entries(STANDARD_COLUMNS)) {
    const matchedHeader = findBestMatch(variations, headerLookup);
    if (matchedHeader) {
      mapping[standardCol] = matchedHeader;
    }
  }
  
  return mapping;
}

function findBestMatch(variations: string[], headerLookup: Map<string, string>): string | undefined {
  for (const variation of variations) {
    const cleanVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (headerLookup.has(cleanVariation)) {
      return headerLookup.get(cleanVariation);
    }
  }
  
  // Try partial matches
  for (const variation of variations) {
    const cleanVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [cleanHeader, originalHeader] of headerLookup.entries()) {
      if (cleanHeader.includes(cleanVariation) || cleanVariation.includes(cleanHeader)) {
        return originalHeader;
      }
    }
  }
  
  return undefined;
}

function mapRecordToTrade(record: Record<string, string>, mapping: Record<string, string>, rowNumber: number): Partial<EnhancedParsedTrade> | null {
  try {
    const mapped: Record<string, string | number | Date> = {};
    
    // Map basic required fields
    if (mapping.symbol && record[mapping.symbol]) {
      mapped.symbol = String(record[mapping.symbol]).trim();
    } else {
      throw new Error('Missing required symbol');
    }
    
    if (mapping.quantity && record[mapping.quantity]) {
      mapped.quantity = parseFloat(String(record[mapping.quantity]).replace(/,/g, ''));
      if (isNaN(mapped.quantity)) throw new Error('Invalid quantity');
    } else {
      throw new Error('Missing required quantity');
    }
    
    if (mapping.tradeType && record[mapping.tradeType]) {
      const type = String(record[mapping.tradeType]).toLowerCase().trim();
      mapped.tradeType = type.includes('buy') ? 'BUY' : type.includes('sell') ? 'SELL' : type.toUpperCase();
    } else {
      throw new Error('Missing required trade type');
    }
    
    // Handle date
    if (mapping.date && record[mapping.date]) {
      mapped.date = parseTradeDate(String(record[mapping.date]));
    } else {
      throw new Error('Missing required date');
    }
    
    // Handle time (optional)
    mapped.time = mapping.time && record[mapping.time] ? String(record[mapping.time]).trim() : '00:00:00';
    
    // Handle prices - for P&L calculation, we need at least one price
    const entryPrice = mapping.entryPrice && record[mapping.entryPrice] ? 
      parseFloat(String(record[mapping.entryPrice]).replace(/,/g, '')) : null;
    const exitPrice = mapping.exitPrice && record[mapping.exitPrice] ? 
      parseFloat(String(record[mapping.exitPrice]).replace(/,/g, '')) : null;
    
    // Handle price fields - Indian brokers often have single "Price" column
    if (entryPrice || exitPrice) {
      mapped.entryPrice = entryPrice || exitPrice || 0;
      mapped.exitPrice = exitPrice || entryPrice || 0;
    } else if (mapping.entryPrice && record[mapping.entryPrice]) {
      // Single price column - use for both entry and exit
      const price = parseFloat(String(record[mapping.entryPrice]).replace(/,/g, ''));
      mapped.entryPrice = price;
      mapped.exitPrice = price;
    } else {
      mapped.entryPrice = 0;
      mapped.exitPrice = 0;
    }
    
    // Handle P&L - for single price transactions, P&L is often 0 or requires pairing
    if (mapping.profitLoss && record[mapping.profitLoss]) {
      mapped.profitLoss = parseFloat(String(record[mapping.profitLoss]).replace(/,/g, ''));
    } else {
      // For single-price transactions (buy/sell separately), set P&L to 0
      // Real P&L calculation would require pairing buy/sell transactions
      mapped.profitLoss = 0;
    }
    
    // Handle optional fields
    mapped.commission = mapping.commission && record[mapping.commission] ? 
      parseFloat(String(record[mapping.commission]).replace(/,/g, '')) : 0;
    
    // Generate trade ID if not provided
    mapped.tradeId = mapping.tradeId && record[mapping.tradeId] ? 
      String(record[mapping.tradeId]) : `TRADE_${rowNumber}_${Date.now()}`;
    
    // Add optional Indian broker specific fields
    const optionalFields = ['exchange', 'productType', 'isin', 'brokerage', 'ett', 'gst', 'stt', 'sebi', 'stampDuty', 'orderNumber', 'tradeNumber'];
    optionalFields.forEach(field => {
      if (mapping[field] && record[mapping[field]]) {
        const value = String(record[mapping[field]]).trim();
        if (['brokerage', 'ett', 'gst', 'stt', 'sebi', 'stampDuty'].includes(field)) {
          mapped[field] = parseFloat(value.replace(/,/g, '')) || 0;
        } else {
          mapped[field] = value;
        }
      }
    });
    
    return mapped;
    
  } catch (error) {
    console.error(`Error mapping row ${rowNumber}:`, error);
    return null;
  }
}

function parseTradeDate(dateStr: string): Date {
  const cleaned = dateStr.trim();
  
  // Common Indian date formats with their date-fns format strings
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