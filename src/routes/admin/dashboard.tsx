import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, Receipt, CircleDollarSign, AlertTriangle, ArrowRight, ArrowDownRight, Clock } from "lucide-react";
import { useDashboardStats, useRecentPayments, RecentPayment } from "../../hooks/use-admin-dashboard";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorBoundary } from "../../components/shared/ErrorBoundary";
import { format } from "date-fns";

function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentPayments, isLoading: paymentsLoading } = useRecentPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of all installments and clients.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deals Count</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expected Rev</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">
                ${stats?.expectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Balance</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[100px]" />
            ) : (
              <div className="text-2xl font-bold">
                ${stats?.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Overdue Installments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.overdueCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Payments Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPayments && recentPayments.length > 0 ? (
              <div className="divide-y">
                {recentPayments.map((payment: RecentPayment) => {
                  const clientName = payment.deals?.clients?.profiles?.name || 'Unknown Client';
                  const productName = payment.deals?.product_name || 'Unknown Deal';

                  return (
                    <div key={payment.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${payment.status === 'PAID' ? 'bg-green-100 text-green-600' : payment.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                          {payment.status === 'PAID' ? <ArrowRight className="h-4 w-4" /> : payment.status === 'PENDING' ? <Clock className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{clientName}</p>
                          <p className="text-xs text-gray-500">{productName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(payment.payment_date || payment.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right w-24">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-gray-500">
                No recent payments active.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
