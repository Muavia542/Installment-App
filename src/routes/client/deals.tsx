import React from "react";
import { useAuth } from "../../lib/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { useClientDeals } from "../../hooks/use-client-queries";

export function ClientDeals() {
  const { data: deals, isLoading } = useClientDeals();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">Active</Badge>;
      case 'COMPLETED': return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">Completed</Badge>;
      case 'DEFAULTED': return <Badge variant="destructive">Defaulted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Deals</h1>
        <p className="text-sm text-gray-500">View your active and past installment contracts.</p>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Monthly Installment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading deals...</TableCell>
              </TableRow>
            ) : deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">You have no active deals.</TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.product_name}</TableCell>
                  <TableCell>${deal.total_amount.toLocaleString()}</TableCell>
                  <TableCell>${deal.remaining_amount.toLocaleString()}</TableCell>
                  <TableCell>${deal.monthly_installment.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(deal.status)}</TableCell>
                  <TableCell>{new Date(deal.start_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
