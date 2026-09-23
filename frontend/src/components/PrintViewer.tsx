import React from 'react';
import { Printer, X } from 'lucide-react';
import { Voucher, Account } from '../types';

interface PrintViewerProps {
  voucher: Voucher | null;
  reportData?: {
    title: string;
    subtitle: string;
    headers: string[];
    rows: any[][];
    totals?: string[];
  } | null;
  onClose: () => void;
}

export default function PrintViewer({ voucher, reportData, onClose }: PrintViewerProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col my-8" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Print Preview (Laser / Dot-Matrix Mode)</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Sheet */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          <div className="bg-white p-10 shadow-sm border border-slate-300 w-full max-w-[210mm] min-h-[297mm] text-slate-800 font-mono text-xs flex flex-col justify-between">
            
            {/* Header section */}
            <div>
              <div className="text-center mb-6">
                <h1 className="text-lg font-bold tracking-wider text-slate-900">KAYAAR EXPORTS PRIVATE LIMITED</h1>
                <p className="text-[10px] text-slate-500">RAILWAY FEEDER ROAD, K.R. NAGAR - 628 503 KOVILPATTI TALUK</p>
                <div className="border-t border-b border-black py-1 my-2 font-bold uppercase tracking-widest text-[11px]">
                  {voucher ? `${voucher.type} Voucher` : (reportData?.title || "Report Document")}
                </div>
              </div>

              {voucher ? (
                <>
                  {/* Voucher Specific metadata */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-[11px] pb-4 border-b border-dashed border-slate-300">
                    <div>
                      <div className="flex justify-between max-w-xs">
                        <span className="text-slate-500">Vou.No:</span>
                        <span className="font-bold">{voucher.id || voucher.voucherNo}</span>
                      </div>
                      {voucher.billNo && (
                        <div className="flex justify-between max-w-xs">
                          <span className="text-slate-500">Bill No:</span>
                          <span>{voucher.billNo}</span>
                        </div>
                      )}
                      {voucher.chequeNo && (
                        <div className="flex justify-between max-w-xs">
                          <span className="text-slate-500">Cheque/UTR No:</span>
                          <span>{voucher.chequeNo}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div>
                        <span className="text-slate-500">Date:</span>{' '}
                        <span className="font-bold">{voucher.voucherDate}</span>
                      </div>
                      {voucher.billDate && (
                        <div>
                          <span className="text-slate-500">Bill Date:</span>{' '}
                          <span>{voucher.billDate}</span>
                        </div>
                      )}
                      {voucher.chequeDate && (
                        <div>
                          <span className="text-slate-500">Cheque Date:</span>{' '}
                          <span>{voucher.chequeDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {voucher.cashAccount && (
                    <div className="mb-4 font-bold text-[11px]">
                      Through : <span className="underline">{voucher.cashAccount}</span>
                    </div>
                  )}
                  {voucher.bankAccount && (
                    <div className="mb-4 font-bold text-[11px]">
                      Through : <span className="underline">{voucher.bankAccount}</span>
                    </div>
                  )}

                  {/* Main Voucher Table */}
                  <table className="w-full text-left border-collapse mb-6">
                    <thead>
                      <tr className="border-t border-b border-black font-bold">
                        <th className="py-2 text-[10px]">Sl.No</th>
                        <th className="py-2 text-[10px]">Particulars / Account Head</th>
                        <th className="py-2 text-right text-[10px] w-32">Debit (Rs)</th>
                        <th className="py-2 text-right text-[10px] w-32">Credit (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucher.items.map((item, index) => (
                        <tr key={index} className="align-top">
                          <td className="py-2 pr-2 text-[10px]">{index + 1}</td>
                          <td className="py-2 pr-4 text-[10px]">
                            <div className="font-bold">{item.accountName}</div>
                            {item.narration && (
                              <div className="text-[9px] text-slate-500 italic mt-0.5">{item.narration}</div>
                            )}
                          </td>
                          <td className="py-2 text-right text-[10px] font-bold">
                            {item.debit > 0 ? item.debit.toFixed(2) : '-'}
                          </td>
                          <td className="py-2 text-right text-[10px] font-bold">
                            {item.credit > 0 ? item.credit.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Narration and Amount in Words */}
                  <div className="text-[10px] border-t border-dashed border-slate-300 pt-3 mb-6">
                    <p className="mb-1"><span className="text-slate-500">Narration:</span> {voucher.narration}</p>
                    <p className="font-bold uppercase mt-2">
                      <span className="text-slate-500 lowercase">Amount in words: </span> 
                      {voucher.totalAmount === 0 ? "Zero Rupees" : getAmountInWords(voucher.totalAmount) + " only"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Report Format */}
                  <div className="text-center mb-4 text-[11px] text-slate-600">
                    {reportData?.subtitle}
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-t border-b border-black font-bold">
                        {reportData?.headers.map((hdr, i) => (
                          <th key={i} className={`py-2 text-[10px] ${i >= reportData.headers.length - 2 ? 'text-right' : ''}`}>
                            {hdr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {row.map((cell, cIdx) => (
                            <td 
                              key={cIdx} 
                              className={`py-1.5 text-[9px] border-b border-slate-100 ${
                                cIdx >= row.length - 2 ? 'text-right font-mono' : ''
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {reportData?.totals && (
                        <tr className="border-t border-b border-black font-bold font-mono">
                          {reportData.totals.map((totalVal, i) => (
                            <td 
                              key={i} 
                              className={`py-2 text-[10px] ${
                                i >= reportData.totals!.length - 2 ? 'text-right' : ''
                              }`}
                            >
                              {totalVal}
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* Verification & Signatures footer */}
            <div className="pt-20 border-t border-slate-200">
              <div className="grid grid-cols-4 gap-4 text-center text-[10px] font-bold">
                <div>
                  <div className="border-t border-black pt-2">PREPARED BY</div>
                </div>
                <div>
                  <div className="border-t border-black pt-2">VERIFIED BY</div>
                </div>
                <div>
                  <div className="border-t border-black pt-2">POWER ADMIN</div>
                </div>
                <div>
                  <div className="border-t border-black pt-2">AUTHORISED SIGNATORY</div>
                </div>
              </div>
              <div className="text-center text-[8px] text-slate-400 mt-6 font-sans">
                Printed on {new Date().toLocaleString()} | AccuFlow ERP System
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Indian Rupee conversion rules helper
function getAmountInWords(amount: number): string {
  const words = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (amount === 0) return 'zero';

  function convertLessThanOneThousand(n: number): string {
    if (n < 20) return words[n];
    const digit = n % 10;
    if (n < 100) return tens[Math.floor(n / 10)] + (digit ? '-' + words[digit] : '');
    const hDigit = Math.floor(n / 100);
    const rest = n % 100;
    return words[hDigit] + ' hundred' + (rest ? ' and ' + convertLessThanOneThousand(rest) : '');
  }

  let wordsString = '';
  let remaining = Math.floor(amount);

  // Lakhs
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    wordsString += convertLessThanOneThousand(lakhs) + ' lakh ';
    remaining %= 100000;
  }
  // Thousands
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    wordsString += convertLessThanOneThousand(thousands) + ' thousand ';
    remaining %= 1000;
  }
  // Rest
  if (remaining > 0) {
    wordsString += convertLessThanOneThousand(remaining);
  }

  const paise = Math.round((amount - Math.floor(amount)) * 100);
  if (paise > 0) {
    wordsString += ' and ' + convertLessThanOneThousand(paise) + ' paise';
  }

  return wordsString.trim().toUpperCase();
}
