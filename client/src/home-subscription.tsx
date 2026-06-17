// @ts-nocheck
/* ============================================================
   Samaagum Home — Subscription & Checkout Flow
   ============================================================ */

const formatPrice = (amount: number, currency: string = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
};

const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

// Helper function to dynamically load Razorpay SDK script if not already loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ──────────────────────────────────────────────────────────────
   1. UPGRADE PAGE
   ────────────────────────────────────────────────────────────── */
window.UpgradePage = function UpgradePage({ st, go }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const userPlan = st.subscription?.plan || 'free';

  useEffect(() => {
    fetch(`${apiBase}/api/subscription/plans/public`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setPlans(res.data || []);
        } else {
          console.error('Failed to fetch plans', res.message);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="view-enter" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="view-enter pricing-page scroll">
      <div className="v-header">
        <button className="hbtn hbtn--ghost" onClick={() => go("home")}>
          <I.arrowL /> Back
        </button>
        <h2 className="v-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"var(--primary)" }}><I.crown style={{ width:24, height:24 }} /></span>
          Upgrade Subscription
        </h2>
        <p className="v-subtitle">Choose the perfect plan for your community experience and gain professional edge.</p>
      </div>

      <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
        <div className="cycle-toggle glass-card">
          <button 
            className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly <span className="discount-badge">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map(plan => {
          const pricing = plan.pricing[billingCycle] || {};
          const priceAmount = pricing.amount || 0;
          const isCurrent = userPlan === plan.name.toLowerCase();

          return (
            <div key={plan.id} className={`pricing-card glass-card ${plan.is_popular ? 'popular' : ''}`}>
              {plan.is_popular && <div className="popular-tag">Most Popular</div>}
              <div className="card-head">
                <div className="plan-cat">{plan.category.toUpperCase()}</div>
                <h3 className="plan-name">{plan.display_name}</h3>
                <p className="plan-desc">{plan.description}</p>
                <div className="price-box">
                  <span className="price-amount">{formatPrice(priceAmount, pricing.currency)}</span>
                  <span className="price-period">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="feature-title">FEATURES INCLUDED:</div>
                <ul className="feature-list">
                  {Array.isArray(plan.features) && plan.features.map((f, i) => (
                    <li key={i} className="feature-item">
                      <span className="bullet"><I.check /></span>
                      <span>{f.name || f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-foot">
                {isCurrent ? (
                  <button className="btn btn-secondary w-full" disabled>
                    Current Plan
                  </button>
                ) : (
                  <button 
                    className={`btn ${plan.is_popular ? 'btn-primary' : 'btn-secondary'} w-full`}
                    onClick={() => go("checkout", { selectedPlan: plan, billingCycle })}
                  >
                    Get {plan.display_name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


/* ──────────────────────────────────────────────────────────────
   2. CHECKOUT PAGE
   ────────────────────────────────────────────────────────────── */
window.CheckoutPage = function CheckoutPage({ param, st, go }) {
  const { selectedPlan, billingCycle } = param || {};
  const [shippingAddress, setShippingAddress] = useState({
    firstName: ME.name.split(' ')[0] || '',
    lastName: ME.name.split(' ')[1] || '',
    company: '',
    address1: 'Indiranagar 100 Feet Rd',
    address2: 'Flat 402',
    city: 'Bengaluru',
    state: 'Karnataka',
    postcode: '560038',
    country: 'IN'
  });

  const [billingAddress, setBillingAddress] = useState({
    firstName: ME.name.split(' ')[0] || '',
    lastName: ME.name.split(' ')[1] || '',
    company: '',
    address1: 'Indiranagar 100 Feet Rd',
    address2: 'Flat 402',
    city: 'Bengaluru',
    state: 'Karnataka',
    postcode: '560038',
    country: 'IN',
    email: ME.handle.replace('@', '') + '@samaagum.com',
    phone: '9876543210'
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!selectedPlan) {
    return (
      <div className="view-enter" style={{ padding: 24, textAlign: "center" }}>
        <h3>No plan selected</h3>
        <button className="btn btn-primary" onClick={() => go("upgrade")} style={{ marginTop:16 }}>Go to Plans</button>
      </div>
    );
  }

  const pricing = selectedPlan.pricing[billingCycle] || {};
  const basePrice = pricing.amount || 0;

  const discountedPrice = Math.max(0, basePrice - discountAmount);
  const taxAmount = billingAddress.country === 'IN' ? discountedPrice * 0.18 : 0;
  const finalTotal = discountedPrice + taxAmount;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponLoading(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInRlbmFudElkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIn0.mocksignature';
      const response = await fetch(`${apiBase}/api/subscription/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: basePrice,
          subscriptionPlanId: selectedPlan.id
        })
      });
      const res = await response.json();
      if (res.success) {
        setAppliedCoupon(res.data.coupon);
        setDiscountAmount(res.data.discountAmount);
      } else {
        setErrorMessage(res.message || 'Invalid coupon code');
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInRlbmFudElkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIn0.mocksignature';
      
      // 1. Create order on backend
      const orderRes = await fetch(`${apiBase}/api/subscription/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planType: billingCycle,
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
          paymentMethod: 'razorpay',
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        })
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const order = orderData.data;

      // If total is 0 (fully discounted or free plan), order is completed instantly
      if (order.total === 0) {
        // Sync user subscription details state
        st.setSubscription({
          plan: billingCycle,
          status: 'active',
          planId: selectedPlan.id,
          orderNumber: order.orderNumber
        });
        go("checkout-success", { orderId: order.orderId, orderNumber: order.orderNumber, selectedPlan, total: 0, billingCycle });
        return;
      }

      // 2. Initialize Razorpay Payment
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your connection.');
      }

      // Create Payment Intent on backend
      const intentRes = await fetch(`${apiBase}/api/subscription/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: order.orderId })
      });

      const intentData = await intentRes.json();
      if (!intentData.success) {
        throw new Error(intentData.message || 'Failed to initialize payment gateway');
      }

      const intent = intentData.data;

      // Handle Mock Sandbox bypass if server operates in mock mode
      if (intentData.sandbox) {
        // Confirm mock payment automatically for seamless testing
        const confirmRes = await fetch(`${apiBase}/api/subscription/payment/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: order.orderId,
            paymentIntentId: intent.orderId,
            razorpayPaymentId: 'mock_payment_id',
            razorpaySignature: 'mock_signature'
          })
        });

        const confirmData = await confirmRes.json();
        if (!confirmData.success) {
          throw new Error(confirmData.message || 'Mock payment confirmation failed');
        }

        // Sync subscription state
        st.setSubscription({
          plan: selectedPlan.name.toLowerCase(),
          status: 'active',
          planId: selectedPlan.id,
          orderNumber: order.orderNumber
        });

        go("checkout-success", { orderId: order.orderId, orderNumber: order.orderNumber, selectedPlan, total: finalTotal, billingCycle });
        return;
      }

      // Standard Razorpay Options
      const options = {
        key: intent.key,
        amount: intent.amount,
        currency: intent.currency,
        name: 'Samaagum',
        description: `Upgrade to ${selectedPlan.display_name} (${billingCycle})`,
        order_id: intent.orderId,
        handler: async (response) => {
          try {
            setCheckoutLoading(true);
            const confirmRes = await fetch(`${apiBase}/api/subscription/payment/confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: order.orderId,
                paymentIntentId: intent.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            const confirmData = await confirmRes.json();
            if (!confirmData.success) {
              throw new Error(confirmData.message || 'Payment confirmation failed');
            }

            // Sync user subscription details state
            st.setSubscription({
              plan: selectedPlan.name.toLowerCase(),
              status: 'active',
              planId: selectedPlan.id,
              orderNumber: order.orderNumber
            });

            go("checkout-success", { orderId: order.orderId, orderNumber: order.orderNumber, selectedPlan, total: finalTotal, billingCycle });
          } catch (err) {
            setErrorMessage(err.message || 'Error confirming payment');
          } finally {
            setCheckoutLoading(false);
          }
        },
        prefill: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          email: billingAddress.email,
          contact: billingAddress.phone
        },
        theme: {
          color: '#6d5efc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setErrorMessage(response.error.description || 'Payment failed');
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error processing checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="view-enter checkout-page scroll">
      <div className="v-header">
        <button className="hbtn hbtn--ghost" onClick={() => go("upgrade")}>
          <I.arrowL /> Back to Plans
        </button>
        <h2 className="v-title">Checkout</h2>
        <p className="v-subtitle">Complete your purchase safely and unlock premium access instantly.</p>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          {/* Shipping Details */}
          <div className="checkout-section glass-card">
            <h3 className="section-title"><I.user /> Shipping Information</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={shippingAddress.firstName} 
                  onChange={e => setShippingAddress({...shippingAddress, firstName: e.target.value})} 
                />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={shippingAddress.lastName} 
                  onChange={e => setShippingAddress({...shippingAddress, lastName: e.target.value})} 
                />
              </div>
              <div className="input-group full">
                <label>Address Line 1</label>
                <input 
                  type="text" 
                  value={shippingAddress.address1} 
                  onChange={e => setShippingAddress({...shippingAddress, address1: e.target.value})} 
                />
              </div>
              <div className="input-group full">
                <label>Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  value={shippingAddress.address2} 
                  onChange={e => setShippingAddress({...shippingAddress, address2: e.target.value})} 
                />
              </div>
              <div className="input-group">
                <label>City</label>
                <input 
                  type="text" 
                  value={shippingAddress.city} 
                  onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} 
                />
              </div>
              <div className="input-group">
                <label>State / Region</label>
                <input 
                  type="text" 
                  value={shippingAddress.state} 
                  onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} 
                />
              </div>
              <div className="input-group">
                <label>Postal Code</label>
                <input 
                  type="text" 
                  value={shippingAddress.postcode} 
                  onChange={e => setShippingAddress({...shippingAddress, postcode: e.target.value})} 
                />
              </div>
              <div className="input-group">
                <label>Country</label>
                <select 
                  value={shippingAddress.country} 
                  onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})}
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Billing Contact */}
          <div className="checkout-section glass-card">
            <h3 className="section-title"><I.msg /> Contact Details</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={billingAddress.email} 
                  onChange={e => setBillingAddress({...billingAddress, email: e.target.value})} 
                />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={billingAddress.phone} 
                  onChange={e => setBillingAddress({...billingAddress, phone: e.target.value})} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="checkout-sidebar">
          <div className="glass-card order-summary">
            <h3 className="summary-title">Order Summary</h3>
            
            <div className="summary-item main">
              <div>
                <div className="plan-name">{selectedPlan.display_name}</div>
                <div className="plan-cycle">{billingCycle === 'yearly' ? 'Yearly billing' : 'Monthly billing'}</div>
              </div>
              <div className="plan-price">{formatPrice(basePrice, pricing.currency)}</div>
            </div>

            {/* Coupon field */}
            <form onSubmit={handleApplyCoupon} className="coupon-form">
              <input 
                type="text" 
                placeholder="PROMO CODE" 
                value={couponCode} 
                onChange={e => setCouponCode(e.target.value)} 
                disabled={appliedCoupon !== null}
              />
              <button 
                type="submit" 
                className="btn btn-secondary"
                disabled={couponLoading || appliedCoupon !== null || !couponCode}
              >
                {couponLoading ? '...' : (appliedCoupon ? 'Applied' : 'Apply')}
              </button>
            </form>

            {appliedCoupon && (
              <div className="applied-coupon-msg">
                <span>Code <strong>{appliedCoupon.code}</strong> applied!</span>
                <button 
                  type="button" 
                  className="remove-coupon-btn"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setDiscountAmount(0);
                    setCouponCode('');
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            <div className="divider" />

            <div className="pricing-rows">
              <div className="price-row">
                <span>Subtotal</span>
                <span>{formatPrice(basePrice, pricing.currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="price-row discount">
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount, pricing.currency)}</span>
                </div>
              )}
              <div className="price-row">
                <span>GST (18%)</span>
                <span>{formatPrice(taxAmount, pricing.currency)}</span>
              </div>
              <div className="divider" />
              <div className="price-row total">
                <span>Total Due</span>
                <span>{formatPrice(finalTotal, pricing.currency)}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="checkout-error-msg">
                <span className="bullet"><I.x style={{ width: 14, height: 14 }} /></span>
                <span>{errorMessage}</span>
              </div>
            )}

            <button 
              className="btn btn-primary w-full pay-btn" 
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Processing Payment...' : 'Pay & Activate Access'}
            </button>

            <div className="secure-badge">
              <I.lock style={{ width:12, height:12 }} /> Secured Razorpay Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ──────────────────────────────────────────────────────────────
   3. CHECKOUT SUCCESS PAGE
   ────────────────────────────────────────────────────────────── */
window.CheckoutSuccessPage = function CheckoutSuccessPage({ param, go }) {
  const { orderNumber, selectedPlan, total, billingCycle } = param || {};

  return (
    <div className="view-enter checkout-success-page scroll" style={{ textAlign:"center", padding:"64px 24px" }}>
      <div className="success-icon-box">
        <I.check className="success-icon" style={{ width:48, height:48 }} />
      </div>
      <h2 className="success-title">Subscription Activated!</h2>
      <p className="success-subtitle">Thank you for upgrading. Your premium benefits are now active.</p>

      <div className="glass-card success-summary" style={{ maxWidth: 440, margin: "32px auto", padding: 24, textAlign:"left" }}>
        <div className="success-row">
          <span className="label">Order Number:</span>
          <span className="val">{orderNumber || 'SUB-000001'}</span>
        </div>
        <div className="success-row">
          <span className="label">Plan Details:</span>
          <span className="val">{selectedPlan?.display_name || 'Premium'} · {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
        </div>
        <div className="success-row">
          <span className="label">Total Paid:</span>
          <span className="val">{formatPrice(total || 0)}</span>
        </div>
        <div className="success-row">
          <span className="label">Status:</span>
          <span className="val active-status-tag">Active</span>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"center", gap:16 }}>
        <button className="btn btn-primary" onClick={() => go("home")}>
          Go to Home Feed
        </button>
        <button className="btn btn-secondary" onClick={() => go("profile")}>
          View Profile
        </button>
      </div>
    </div>
  );
};
