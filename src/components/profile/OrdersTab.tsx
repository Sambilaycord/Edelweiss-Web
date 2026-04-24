import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

type OrderStatus = 'To Pay' | 'To Ship' | 'To Receive' | 'Completed' | 'Return/Refund' | 'Cancelled';

const ITEMS_PER_PAGE = 15;

const OrdersTab: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('To Pay');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const fetchOrders = async (pageNum: number, status: OrderStatus) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const from = pageNum * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Map status names to database status values if they differ
      // For now assuming they match or have a mapping
      const statusMapping: Record<OrderStatus, string> = {
        'To Pay': 'pending_payment',
        'To Ship': 'processing',
        'To Receive': 'shipped',
        'Completed': 'delivered',
        'Return/Refund': 'return_requested',
        'Cancelled': 'cancelled'
      };

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image_urls
            )
          )
        `)
        .eq('customer_id', user.id)
        .eq('status', statusMapping[status])
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        setOrders(prev => pageNum === 0 ? data : [...prev, ...data]);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset and fetch when status changes
  useEffect(() => {
    setPage(0);
    setOrders([]);
    setHasMore(true);
    fetchOrders(0, activeStatus);
  }, [activeStatus]);

  // Fetch next page
  useEffect(() => {
    if (page > 0) {
      fetchOrders(page, activeStatus);
    }
  }, [page]);

  const statuses: OrderStatus[] = [
    'To Pay',
    'To Ship',
    'To Receive',
    'Completed',
    'Return/Refund',
    'Cancelled'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-100 -mx-8 px-8 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex w-full pb-0.5">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex-1 pb-4 text-sm font-medium transition-all relative cursor-pointer min-w-max px-4 
                ${activeStatus === status ? 'text-pink-600' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {status}
              {activeStatus === status && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-pink-600 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-8">
        {loading && page === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-pink-600" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 text-gray-500 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Package size={32} className="text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No {activeStatus.toLowerCase()} orders</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              When you place an order, its status will be updated here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <div 
                key={order.id} 
                ref={index === orders.length - 1 ? lastElementRef : null}
                className="bg-white border-2 border-gray-100 rounded-[24px] p-6 hover:shadow-lg transition-all"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID: {order.order_number}</p>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="bg-pink-50 text-pink-600 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-pink-100">
                    {activeStatus}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
                        <img 
                          src={item.products?.image_urls?.[0] || 'https://via.placeholder.com/150'} 
                          alt={item.products?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.products?.name}</h4>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-bold text-pink-600">₱{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="text-xs text-gray-400">Total Amount</div>
                  <div className="text-lg font-black text-gray-900">₱{order.total_amount.toLocaleString()}</div>
                </div>
              </div>
            ))}

            {loadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-pink-600" size={24} />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default OrdersTab;
