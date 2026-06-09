import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { ReceiptText, FileDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Payment } from "../../types";
import { ReceiptDialog } from "../../components/receipts/ReceiptDialog";

export function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          deal:deals(
            product_name,
            client:clients(
              profile:profiles(name)
            )
          )
        `)
        .order('payment_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching payments:', error);
      } else {
        setPayments(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">Track all received and pending payments.</p>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading payments...</TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">No payments found.</TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">
                    {/* @ts-ignore - nested relationships typing can be tricky but structure matches our select */}
                    {payment.deal?.client?.profile?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{payment.deal?.product_name || 'Unknown'}</TableCell>
                  <TableCell>${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                      <ReceiptText className="h-4 w-4 mr-1" />
                      View
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
          // @ts-ignore
          name: selectedPayment?.deal?.client?.profile?.name,
        }}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}
