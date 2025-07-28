"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Image, FileText, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Target, BarChart3, RefreshCw } from "lucide-react";
import Sidebar from "@/components/navigation/sidebar";

interface ValidationChecklist {
  id: string;
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  explanation: string;
  recommendation: string;
}

interface ValidationResult {
  overall: 'pass' | 'fail' | 'warning';
  score: number;
  checklist: ValidationChecklist[];
  guidance: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

interface TradeDetails {
  symbol: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  tradeType: 'buy' | 'sell';
}

export default function ValidatorPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [tradeDetails, setTradeDetails] = useState<TradeDetails>({
    symbol: "",
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    positionSize: 0,
    tradeType: "buy"
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/validator/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedImage(data.imageUrl);
        setImageId(data.imageId);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleValidate = async () => {
    if (!imageId || !description.trim()) {
      setError('Please upload an image and provide a trade description');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/validator/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          description,
          tradeDetails: showTradeDetails ? tradeDetails : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setValidationResult(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to validate trade idea');
      }
    } catch (error) {
      console.error('Error validating trade idea:', error);
      setError('Failed to validate trade idea. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'fail':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resetForm = () => {
    setUploadedImage(null);
    setImageId(null);
    setDescription("");
    setTradeDetails({
      symbol: "",
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      positionSize: 0,
      tradeType: "buy"
    });
    setValidationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Trade Idea Validator</h1>
              <p className="text-muted-foreground">
                Upload chart images and get AI-powered validation for your trade ideas
              </p>
            </div>
            <Button
              onClick={resetForm}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Chart Image
                </CardTitle>
                <CardDescription>
                  Upload a chart image (JPG, PNG, WebP) to analyze your trade idea
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    uploadedImage
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <img
                        src={uploadedImage}
                        alt="Uploaded chart"
                        className="max-w-full h-48 object-contain mx-auto rounded-lg"
                      />
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Image uploaded successfully
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Image className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Drag and drop your chart image here, or
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Supports JPG, PNG, WebP (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isUploading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Uploading image...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trade Description Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Trade Description
                </CardTitle>
                <CardDescription>
                  Describe your trade idea and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Trade Description
                  </label>
                  <Textarea
                    placeholder="Describe your trade idea, analysis, and reasoning..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTradeDetails(!showTradeDetails)}
                  >
                    {showTradeDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showTradeDetails ? 'Hide' : 'Add'} Trade Details
                  </Button>
                </div>

                {showTradeDetails && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Symbol</label>
                        <Input
                          placeholder="e.g., RELIANCE"
                          value={tradeDetails.symbol}
                          onChange={(e) => setTradeDetails({...tradeDetails, symbol: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Trade Type</label>
                        <select
                          value={tradeDetails.tradeType}
                          onChange={(e) => setTradeDetails({...tradeDetails, tradeType: e.target.value as 'buy' | 'sell'})}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="buy">Buy</option>
                          <option value="sell">Sell</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Entry Price</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={tradeDetails.entryPrice}
                          onChange={(e) => setTradeDetails({...tradeDetails, entryPrice: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Position Size</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={tradeDetails.positionSize}
                          onChange={(e) => setTradeDetails({...tradeDetails, positionSize: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Stop Loss</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={tradeDetails.stopLoss}
                          onChange={(e) => setTradeDetails({...tradeDetails, stopLoss: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Take Profit</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={tradeDetails.takeProfit}
                          onChange={(e) => setTradeDetails({...tradeDetails, takeProfit: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleValidate}
                  disabled={!imageId || !description.trim() || isValidating}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Validate Trade Idea
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Validation Results
                </CardTitle>
                <CardDescription>
                  AI analysis of your trade idea with trading rules compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">
                      {validationResult.score}%
                    </div>
                    <div className="text-sm text-muted-foreground">Validation Score</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">
                      {validationResult.checklist.filter(item => item.status === 'pass').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Passed Checks</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-1">
                      {validationResult.checklist.filter(item => item.status === 'fail').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed Checks</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Badge className={getRiskLevelColor(validationResult.riskLevel)}>
                      {validationResult.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>

                {/* Overall Result */}
                <div className={`p-4 rounded-lg border ${getStatusColor(validationResult.overall)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(validationResult.overall)}
                    <h3 className="font-semibold">
                      Overall Validation: {validationResult.overall.toUpperCase()}
                    </h3>
                  </div>
                  <p className="text-sm">{validationResult.guidance}</p>
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Validation Checklist</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validationResult.checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border ${getStatusColor(item.status)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(item.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="capitalize">
                                {item.category}
                              </Badge>
                              <h4 className="font-medium">{item.item}</h4>
                            </div>
                            <p className="text-sm mb-2">{item.explanation}</p>
                            {item.recommendation && (
                              <p className="text-sm font-medium">
                                💡 {item.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Sidebar>
  );
} 