import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TEST_CATEGORIES } from "@/types/lab";

type BillingRow = {
  category: string;
  panel: string;
  testName: string;
  value: string;
  unit: string;
};

interface BillingPageProps {
  patient: { name?: string; age?: number | string; gender?: string };
  testResults: Record<string, Record<string, string>>;
  refDoctor: string;
  bookingNo: string;
  invoiceNo: string;
  receiptNo: string;
  billingPayMode: string;
  billingPrices: Record<string, string>;
  billingDiscount: string;
  billingPaid: string;
  onBack: () => void;
  onChangePrice: (testName: string, price: string) => void;
  onChangeDiscount: (discount: string) => void;
  onChangePaid: (paid: string) => void;
  onChangeBookingNo: (bookingNo: string) => void;
  onChangeInvoiceNo: (invoiceNo: string) => void;
  onChangeReceiptNo: (receiptNo: string) => void;
  onChangePayMode: (payMode: string) => void;
}

function toNumber(v: string) {
  const n = parseFloat(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function withDocumentTitle(tempTitle: string, fn: () => void) {
  try {
    const prev = document.title;
    document.title = tempTitle;
    fn();
    setTimeout(() => {
      document.title = prev;
    }, 500);
  } catch {
    fn();
  }
}

function safeFilePart(v: string) {
  return String(v || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .slice(0, 80);
}

function toWords(num: number): string {
  const ones = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const n = Math.floor(Math.max(0, Number.isFinite(num) ? num : 0));
  if (n < 20) return ones[n];

  const twoDigits = (x: number) => {
    if (x < 20) return ones[x];
    const t = Math.floor(x / 10);
    const o = x % 10;
    return o ? `${tens[t]} ${ones[o]}` : tens[t];
  };

  const threeDigits = (x: number) => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    if (!h) return twoDigits(r);
    if (!r) return `${ones[h]} Hundred`;
    return `${ones[h]} Hundred ${twoDigits(r)}`;
  };

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ");
}

export function BillingPage({
  patient,
  testResults,
  refDoctor,
  bookingNo,
  invoiceNo,
  receiptNo,
  billingPayMode,
  billingPrices,
  billingDiscount,
  billingPaid,
  onBack,
  onChangePrice,
  onChangeDiscount,
  onChangePaid,
  onChangeBookingNo,
  onChangeInvoiceNo,
  onChangeReceiptNo,
  onChangePayMode,
}: BillingPageProps) {
  const rows = useMemo<BillingRow[]>(() => {
    const out: BillingRow[] = [];
    TEST_CATEGORIES.forEach((cat) => {
      const resultsForCat = testResults[cat.id] || {};
      cat.panels.forEach((panel) => {
        panel.tests.forEach((test) => {
          const value = resultsForCat[test.name];
          if (typeof value === "string" && value.trim() !== "") {
            out.push({
              category: cat.name,
              panel: panel.name,
              testName: test.name,
              value,
              unit: test.unit,
            });
          }
        });
      });
    });
    return out;
  }, [testResults]);

  const subtotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + toNumber(billingPrices[r.testName] || "0"), 0);
  }, [rows, billingPrices]);

  const discount = toNumber(billingDiscount);
  const grandTotal = Math.max(0, subtotal - discount);
  const paid = toNumber(billingPaid);
  const balance = Math.max(0, grandTotal - paid);

  const billDate = useMemo(() => new Date(), []);

  const billFileBase = useMemo(() => {
    const name = safeFilePart(patient?.name ? String(patient.name) : "Patient");
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${name}-Bill-${yyyy}${mm}${dd}`;
  }, [patient?.name]);

  const receivedText = useMemo(() => {
    const v = Math.floor(paid);
    return `Rs. ${toWords(v)} Only`;
  }, [paid]);

  return (
    <div className="min-h-screen bg-white">
      <style>
        {`@media print {
  .billing-print { font-size: 10px !important; line-height: 1.15 !important; }
  .billing-print .bp-section { padding: 4px !important; }
  .billing-print .bp-banner-logo { height: 64px !important; }
  .billing-print .bp-banner-title { font-size: 16px !important; }
  .billing-print .bp-grid { gap: 6px !important; }
  .billing-print .bp-table th { height: 26px !important; padding-top: 2px !important; padding-bottom: 2px !important; }
  .billing-print .bp-table td { padding-top: 2px !important; padding-bottom: 2px !important; }
  .billing-print .bp-table thead { display: table-header-group !important; }
  .billing-print .bp-table tfoot { display: table-footer-group !important; }
  .billing-print .bp-table tr { break-inside: avoid; page-break-inside: avoid; }
  .billing-print .bp-no-break { break-inside: avoid; page-break-inside: avoid; }
  .billing-print .bp-signatures { padding: 6px !important; }
  .billing-print .bp-received-duplicate { display: none !important; }
}`}
      </style>

      <div className="billing-print max-w-[210mm] mx-auto p-2 print:p-1 text-[11px] print:text-[10px]">
        <div className="flex items-center justify-between mb-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onBack}>
            Back to Final Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => withDocumentTitle(billFileBase, () => window.print())}>
            Print Bill
          </Button>
        </div>

        <div className="border border-gray-300">
          <div className="border-b border-gray-300 p-2 print:p-1 bp-section">
            <div className="grid grid-cols-[6rem,1fr,6rem] items-start">
              <div className="flex items-center justify-start pl-1 -mt-2">
                <img
                  src="/PURVIK.png"
                  alt="Logo"
                  className="bp-banner-logo h-20 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="text-center mt-1 leading-tight">
                <div className="bp-banner-title text-[18px] font-bold tracking-widest uppercase leading-snug whitespace-nowrap">
                  PURVIK DIAGNOSTIC CENTRE
                </div>
                <div className="mt-0.5 text-[10px] leading-4 text-gray-700">
                  <div>A R Khan Complex, Doddamudavadi Sante Gate, Kanakapura Taluk</div>
                  <div>Ramanagar District - 562117 • E-mail: poorvikdiagnostic@gmail.com</div>
                </div>
              </div>
              <div />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 print:gap-2 p-2 print:p-1 border-b border-gray-300 leading-tight bp-grid bp-section">
            <div className="space-y-0.5">
              <div className="font-semibold text-[12px]">{patient?.name || "—"}</div>
              <div><span className="text-gray-700">Age</span>: {patient?.age ?? "—"}</div>
              <div><span className="text-gray-700">Sex</span>: {patient?.gender ? String(patient.gender).charAt(0).toUpperCase() : "—"}</div>
              <div><span className="text-gray-700">UHID</span>: —</div>
            </div>
            <div className="space-y-0.5">
              <div className="font-semibold text-[12px]">Booking</div>
              <div><span className="text-gray-700">Booking Date</span>: {formatDate(billDate)}</div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Booking No.</span>:
                <Input
                  value={bookingNo}
                  onChange={(e) => onChangeBookingNo(e.target.value)}
                  className="h-7 w-40 text-[11px] print:border-none print:bg-transparent print:shadow-none"
                />
              </div>
              <div><span className="text-gray-700">Reference Doctor</span>: {refDoctor || "—"}</div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Invoice No.</span>:
                <Input
                  value={invoiceNo}
                  onChange={(e) => onChangeInvoiceNo(e.target.value)}
                  className="h-7 w-40 text-[11px] print:border-none print:bg-transparent print:shadow-none"
                />
              </div>
            </div>
          </div>

          <div className="py-1.5 text-center font-semibold border-b border-gray-300">Invoice</div>

          <div className="p-0">
            <Table className="text-[11px] bp-table">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="h-9">Particulars</TableHead>
                  <TableHead className="h-9 text-right">Rate (Rs)</TableHead>
                  <TableHead className="h-9 text-right">QTY</TableHead>
                  <TableHead className="h-9 text-right">Amount (Rs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No tests found for billing.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const rate = toNumber(billingPrices[r.testName] || "0");
                    const qty = 1;
                    const amount = rate * qty;
                    return (
                      <TableRow key={r.testName}>
                        <TableCell className="py-1.5 print:py-0.5">
                          <div className="font-medium">{r.testName}</div>
                        </TableCell>
                        <TableCell className="py-1.5 print:py-0.5 text-right">
                          <div className="flex justify-end">
                            <Input
                              value={billingPrices[r.testName] ?? ""}
                              onChange={(e) => onChangePrice(r.testName, e.target.value)}
                              inputMode="decimal"
                              className="h-7 w-20 text-[11px] text-right tabular-nums print:border-none print:bg-transparent print:shadow-none"
                              placeholder="0"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 print:py-0.5 text-right tabular-nums">{qty.toFixed(2)}</TableCell>
                        <TableCell className="py-1.5 print:py-0.5 text-right tabular-nums">{amount.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}

                <TableRow className="bp-no-break">
                  <TableCell colSpan={2} />
                  <TableCell className="py-1.5 print:py-0.5 text-right font-medium">Bill Amount:</TableCell>
                  <TableCell className="py-1.5 print:py-0.5 text-right font-semibold tabular-nums">{subtotal.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow className="bp-no-break">
                  <TableCell colSpan={2} />
                  <TableCell className="py-1.5 print:py-0.5 text-right font-medium">Discount Amount:</TableCell>
                  <TableCell className="py-1.5 print:py-0.5 text-right">
                    <div className="flex justify-end">
                      <Input
                        value={billingDiscount}
                        onChange={(e) => onChangeDiscount(e.target.value)}
                        inputMode="decimal"
                        className="h-7 w-20 text-[11px] text-right tabular-nums print:border-none print:bg-transparent print:shadow-none"
                        placeholder="0"
                      />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="bp-no-break">
                  <TableCell colSpan={2} />
                  <TableCell className="py-1.5 print:py-0.5 text-right font-medium">Final Bill Amount:</TableCell>
                  <TableCell className="py-1.5 print:py-0.5 text-right font-semibold tabular-nums">{grandTotal.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow className="bp-no-break">
                  <TableCell colSpan={2} />
                  <TableCell className="py-1.5 print:py-0.5 text-right font-medium">Paid Amount:</TableCell>
                  <TableCell className="py-1.5 print:py-0.5 text-right">
                    <div className="flex justify-end">
                      <Input
                        value={billingPaid}
                        onChange={(e) => onChangePaid(e.target.value)}
                        inputMode="decimal"
                        className="h-7 w-20 text-[11px] text-right tabular-nums print:border-none print:bg-transparent print:shadow-none"
                        placeholder="0"
                      />
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow className="bp-no-break">
                  <TableCell colSpan={2} />
                  <TableCell className="py-1.5 print:py-0.5 text-right font-medium">Due Amount:</TableCell>
                  <TableCell className="py-1.5 print:py-0.5 text-right font-semibold tabular-nums">{balance.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-gray-300 p-2 print:p-1 leading-tight bp-section bp-no-break">
            <span className="font-semibold">Received with Thanks:</span> {receivedText}
          </div>

          <div className="py-1.5 text-center font-semibold border-t border-b border-gray-300 bp-no-break">Payment</div>

          <div className="p-0">
            <Table className="text-[11px] bp-table">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="h-9 w-[7%]">SN</TableHead>
                  <TableHead className="h-9 w-[22%]">Receipt No</TableHead>
                  <TableHead className="h-9 w-[18%]">Date</TableHead>
                  <TableHead className="h-9 w-[26%]">Invoice No.</TableHead>
                  <TableHead className="h-9 w-[12%] text-right">Amount</TableHead>
                  <TableHead className="h-9 w-[15%]">Paymode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="py-1.5 print:py-0.5">1</TableCell>
                  <TableCell className="py-1.5 print:py-0.5">
                    <Input
                      value={receiptNo}
                      onChange={(e) => onChangeReceiptNo(e.target.value)}
                      className="h-7 text-[11px] print:border-none print:bg-transparent print:shadow-none"
                    />
                  </TableCell>
                  <TableCell className="py-1.5 print:py-0.5">{formatDate(billDate)}</TableCell>
                  <TableCell className="py-1.5 print:py-0.5">{invoiceNo}</TableCell>
                  <TableCell className="py-1.5 print:py-0.5 text-right tabular-nums">{paid.toFixed(2)}</TableCell>
                  <TableCell className="py-1.5 print:py-0.5">
                    <Select value={billingPayMode} onValueChange={(v) => onChangePayMode(v)}>
                      <SelectTrigger className="h-7 text-[11px] print:border-none print:bg-transparent print:shadow-none">
                        <SelectValue placeholder="Paymode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="NetBanking">NetBanking</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={4} className="py-1.5 print:py-0.5 text-right font-medium">Total</TableCell>
                  <TableCell className="py-1.5 print:py-0.5 text-right font-semibold tabular-nums">{paid.toFixed(2)}</TableCell>
                  <TableCell className="py-1.5 print:py-0.5" />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="border-t border-gray-300 p-2 print:p-1 leading-tight bp-section bp-received-duplicate bp-no-break">
            <span className="font-semibold">Received with Thanks:</span> {receivedText}
          </div>

          <div className="p-3 print:p-1 grid grid-cols-2 gap-4 print:gap-3 bp-signatures bp-no-break">
            <div>
              <div className="h-8 print:h-6" />
              <div className="border-t border-gray-600 w-44" />
              <div className="text-[11px] font-medium mt-1">Lab Technician Signature</div>
            </div>
            <div className="text-right">
              <div className="h-8 print:h-6" />
              <div className="border-t border-gray-600 w-44 ml-auto" />
              <div className="text-[11px] font-medium mt-1">Accountant</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
