import React, { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { FileDown, ReceiptText } from "lucide-react";
import { useClientPayments, useClientProfile } from "../../hooks/use-client-queries";
import { ReceiptDialog } from "../../components/receipts/ReceiptDialog";
import { Button } from "../../components/ui/button";

export function ClientPayments() {
  const { data: payments = [], isLoading } = useClientPayments();
  const { data: profileData } = useClientProfile();
  const { profile: userProfile } = useAuth();
  
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">Paid</Badge>;
      case 'PENDING': return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200">Pending</Badge>;
      case 'OVERDUE': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Payment History</h1>
        <p className="text-sm text-gray-500">Track your past and upcoming payments.</p>
      </div>

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">Loading payments...</TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">No payment records found.</TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">
                    {/* @ts-ignore */}
                    {payment.deals?.product_name || 'Unknown'}
                  </TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                      <ReceiptText className="h-4 w-4 mr-1" />
                      View Receipt
                    </Button>
                    {payment.receipt_url && (
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-9 px-3 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Original
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ReceiptDialog 
        payment={selectedPayment}
        clientInfo={{
          name: profileData?.name || userProfile?.name,
          email: userProfile?.email,
          phone: profileData?.phone,
          address: profileData?.address
        }}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}
