import React, { useState } from 'react';
import {
  CreditCard,
  Wallet,
  Smartphone,
  Download,
  Check,
  Plus,
  ChevronRight } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
export function PaymentsBillingScreen() {
  const [selectedMethod, setSelectedMethod] = useState('card1');
  const transactions = [
  {
    id: 1,
    doctor: 'Dr. Sarah Smith',
    date: 'Oct 24, 2023',
    amount: '$50.00',
    status: 'Paid'
  },
  {
    id: 2,
    doctor: 'Dr. James Wilson',
    date: 'Sep 15, 2023',
    amount: '$45.00',
    status: 'Paid'
  },
  {
    id: 3,
    doctor: 'Pharmacy Order',
    date: 'Aug 10, 2023',
    amount: '$12.50',
    status: 'Refunded'
  }];

  return (
    <ScreenContainer title="Payments & Billing" showBack>
      <div className="px-6 py-6 pb-8">
        {/* Wallet Card */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 mb-8">
          <p className="text-blue-100 text-sm font-medium mb-1">
            Wallet Balance
          </p>
          <h2 className="text-3xl font-bold mb-6">$45.00</h2>
          <Button
            variant="secondary"
            className="w-full bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm"
            icon={<Plus size={18} />}>

            Add Money
          </Button>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-text-primary mb-4">
            Payment Methods
          </h3>
          <div className="space-y-3">
            <Card
              className={`flex items-center gap-4 p-4 cursor-pointer border-2 transition-colors ${selectedMethod === 'card1' ? 'border-primary bg-blue-50/30' : 'border-transparent'}`}
              onClick={() => setSelectedMethod('card1')}>

              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <CreditCard size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-text-primary text-sm">
                  Mastercard •••• 4242
                </h4>
                <p className="text-xs text-text-secondary">Expires 12/24</p>
              </div>
              {selectedMethod === 'card1' &&
              <Check size={20} className="text-primary" />
              }
            </Card>

            <Card
              className={`flex items-center gap-4 p-4 cursor-pointer border-2 transition-colors ${selectedMethod === 'upi' ? 'border-primary bg-blue-50/30' : 'border-transparent'}`}
              onClick={() => setSelectedMethod('upi')}>

              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <Smartphone size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-text-primary text-sm">
                  Google Pay
                </h4>
                <p className="text-xs text-text-secondary">john@oksbi</p>
              </div>
              {selectedMethod === 'upi' &&
              <Check size={20} className="text-primary" />
              }
            </Card>
          </div>
          <Button
            variant="outline"
            fullWidth
            className="mt-4"
            icon={<Plus size={18} />}>

            Add Payment Method
          </Button>
        </div>

        {/* Transactions */}
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {transactions.map((tx) =>
            <Card key={tx.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">
                      {tx.doctor}
                    </h4>
                    <p className="text-xs text-text-secondary">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-text-primary">
                      {tx.amount}
                    </span>
                    <Badge
                    variant={
                    tx.status === 'Paid' ?
                    'success' :
                    tx.status === 'Refunded' ?
                    'info' :
                    'warning'
                    }>

                      {tx.status}
                    </Badge>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-50 flex justify-end">
                  <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark">
                    <Download size={14} /> Download Invoice
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ScreenContainer>);

}