import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Download } from 'lucide-react';

interface ReceiptProps {
  payment: any;
  clientInfo?: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptDialog({ payment, clientInfo, isOpen, onClose }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    
    // Create an iframe to print just the receipt contents
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      // inject tailwind inside the iframe for printing styling
      doc.write(`
        <html>
          <head>
            <title>Receipt</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { padding: 40px; font-family: sans-serif; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      doc.close();
      
      // wait a bit for styles to load
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>
            You can view or print this receipt for your records.
          </DialogDescription>
        </DialogHeader>

        {/* Printable Area - Hidden scrollable container */}
        <div className="max-h-[60vh] overflow-y-auto border rounded-md p-4 bg-gray-50/50">
          <div ref={printRef} className="bg-white p-8 border rounded-lg shadow-sm max-w-[800px] mx-auto text-gray-900">
            {/* Receipt Header */}
            <div className="flex justify-between items-start border-b pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-600 tracking-tight">Installment Pro</h2>
                <div className="text-sm text-gray-500 mt-1">
                  123 Business Avenue<br />
                  Suite 100<br />
                  City, ST 12345
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-light text-gray-400">RECEIPT</h1>
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-500">Date:</span> {new Date(payment.payment_date).toLocaleDateString()}<br />
                  <span className="font-medium text-gray-500">Receipt #:</span> {payment.id?.substring(0, 8).toUpperCase()}<br />
                  <span className="font-medium text-gray-500">Status:</span> {payment.status}
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</h3>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{clientInfo?.name || 'Client'}</p>
                {clientInfo?.email && <p className="text-gray-600">{clientInfo.email}</p>}
                {clientInfo?.phone && <p className="text-gray-600">{clientInfo.phone}</p>}
                {clientInfo?.address && <p className="text-gray-600">{clientInfo.address}</p>}
              </div>
            </div>

            {/* Payment Details */}
            <table className="w-full text-sm mb-8">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-semibold text-gray-600 py-3">Description</th>
                  <th className="text-right font-semibold text-gray-600 py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-medium">Installment Payment</p>
                    <p className="text-gray-500 mt-1">For Deal: {payment.deals?.product_name || payment.deal?.product_name || 'N/A'}</p>
                  </td>
                  <td className="text-right py-4 font-medium">${payment.amount?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end border-t-2 border-gray-900 pt-4 mt-8">
              <div className="text-right w-64">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Paid</span>
                  <span>${payment.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center text-sm text-gray-400">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          {payment.receipt_url && (
            <Button variant="secondary" asChild>
              <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Original Document
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
