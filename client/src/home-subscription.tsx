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
  const userPlan = st.subscription?.plan || null;
  const userCycle = st.subscription?.billingCycle || 'monthly';
  const previousPlans = Array.isArray(st.subscription?.previousPlans) ? st.subscription.previousPlans : [];
  const switchablePlans = Array.isArray(st.subscription?.switchablePlans) ? st.subscription.switchablePlans : [];

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
          const isCurrent = userPlan === plan.name.toLowerCase() && userCycle === billingCycle;
          const isPrevious = previousPlans.some(p => p.planId === plan.id && p.billingCycle === billingCycle);
          const switchableMatch = switchablePlans.find(p => p.planId === plan.id && p.billingCycle === billingCycle);

          let buttonContent = `Get ${plan.display_name}`;
          let buttonAction = () => go("checkout", { selectedPlan: plan, billingCycle });

          if (isCurrent) {
            buttonContent = "Current Plan";
          } else if (switchableMatch) {
            buttonContent = "Switch Plan";
            buttonAction = async () => {
              setLoading(true);
              try {
                const res = await fetch(`${apiBase}/api/subscription/switch`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({ orderId: switchableMatch.orderId })
                });
                const json = await res.json();
                if (json.success) {
                  const statusRes = await fetch(`${apiBase}/api/subscription/status`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  const statusJson = await statusRes.json();
                  if (statusJson.success && statusJson.data?.subscription) {
                    if (st.setSubscription) {
                      st.setSubscription(statusJson.data.subscription);
                    }
                  }
                } else {
                  alert(json.message || "Failed to switch plan");
                }
              } catch(e) {
                alert("Error switching plan");
              } finally {
                setLoading(false);
              }
            };
          } else if (isPrevious) {
            buttonContent = "Renew Plan";
          }

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
                <button 
                  className={`btn-sub-cta ${isCurrent ? 'btn-sub-basic' : (plan.is_popular ? 'btn-sub-pro' : 'btn-sub-basic')}`}
                  onClick={buttonAction}
                  disabled={isCurrent || loading}
                >
                  {buttonContent}
                </button>
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
  const savedState = JSON.parse(sessionStorage.getItem('subscriptionCheckout') || '{}');
  
  const [shippingAddress, setShippingAddress] = useState(savedState.shippingAddress || {
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

  const [billingAddress, setBillingAddress] = useState(savedState.billingAddress || {
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

  const [sameAsShipping, setSameAsShipping] = useState(savedState.sameAsShipping !== undefined ? savedState.sameAsShipping : true);
  const [couponCode, setCouponCode] = useState(savedState.couponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState(savedState.appliedCoupon || null);
  const [discountAmount, setDiscountAmount] = useState(savedState.discountAmount || 0);

  useEffect(() => {
    sessionStorage.setItem('subscriptionCheckout', JSON.stringify({
      shippingAddress,
      billingAddress,
      sameAsShipping,
      couponCode,
      appliedCoupon,
      discountAmount
    }));
  }, [shippingAddress, billingAddress, sameAsShipping, couponCode, appliedCoupon, discountAmount]);

  const [couponLoading, setCouponLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Please log in to apply a coupon.');
        return;
      }
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
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Please log in to complete your purchase.');
        setCheckoutLoading(false);
        return;
      }

      const previewRes = await fetch(`${apiBase}/api/subscription/payment/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingCycle: billingCycle,
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        })
      });

      const previewData = await previewRes.json();
      if (!previewData.success) {
        throw new Error(previewData.message || 'Failed to generate preview');
      }

      setPreviewData(previewData.data);
      setShowReviewModal(true);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error processing checkout preview');
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
              className={`btn-sub-cta btn-sub-pay ${checkoutLoading ? 'loading' : ''}`}
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <span className="spinner-small" /> Loading...
                </>
              ) : (
                <>
                  Proceed to Review <I.arrowR style={{ width: 14, height: 14, marginLeft: 4 }} />
                </>
              )}
            </button>

            <div className="secure-badge">
              <I.lock style={{ width:12, height:12 }} /> Secured Razorpay Checkout
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && previewData && (
        <OrderReviewModal 
          previewData={previewData}
          checkoutParams={{
            selectedPlan,
            billingCycle,
            shippingAddress,
            billingAddress: sameAsShipping ? shippingAddress : billingAddress,
            couponCode: appliedCoupon ? appliedCoupon.code : undefined
          }}
          onClose={() => setShowReviewModal(false)}
          st={st}
          go={go}
        />
      )}
    </div>
  );
};


/* ──────────────────────────────────────────────────────────────
   2.5 ORDER REVIEW MODAL
   ────────────────────────────────────────────────────────────── */
const OrderReviewModal = ({ previewData, checkoutParams, onClose, st, go }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRecurring, setAgreedRecurring] = useState(false);

  const handleProceedToPayment = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Please log in to complete your purchase.');
        setLoading(false);
        return;
      }

      // Create order on backend 
      const orderRes = await fetch(`${apiBase}/api/subscription/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: checkoutParams.selectedPlan.id,
          billingCycle: checkoutParams.billingCycle,
          shippingAddress: checkoutParams.shippingAddress,
          billingAddress: checkoutParams.billingAddress,
          couponCode: checkoutParams.couponCode,
          previewId: previewData.previewId
        })
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        if (orderData.code === 'PREVIEW_EXPIRED' || orderData.code === 'COUPON_INVALID') {
          setErrorMessage(orderData.message);
          setTimeout(() => {
            onClose(); // Just close the modal so they can review and click Proceed to Review again
          }, 2000);
          return;
        }
        throw new Error(orderData.message || 'Failed to create order');
      }

      const { orderId, amount, currency, key, localOrderId } = orderData.data;

      // Handle Mock Sandbox bypass
      if (orderData.sandbox) {
        console.log('Using Sandbox bypass for checkout verification');
        setTimeout(async () => {
          try {
            const confirmRes = await fetch(`${apiBase}/api/subscription/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                localOrderId,
                razorpayOrderId: orderId,
                razorpayPaymentId: 'mock_payment_id',
                razorpaySignature: 'mock_signature'
              })
            });

            const confirmData = await confirmRes.json();
            if (!confirmData.success) {
              throw new Error(confirmData.message || 'Sandbox verification failed');
            }

            st.setSubscription({
              plan: checkoutParams.selectedPlan.name.toLowerCase(),
              status: 'active',
              planId: checkoutParams.selectedPlan.id,
              orderNumber: confirmData.data.order_number
            });

            go("checkout-success", {
              order_number: confirmData.data.order_number,
              plan_name: confirmData.data.plan_name,
              billing_cycle: confirmData.data.billing_cycle,
              activated_at: confirmData.data.activated_at,
              next_billing_at: confirmData.data.next_billing_at,
              subscription_status: confirmData.data.subscription_status,
              total: previewData.totalAmount
            });

          } catch (err: any) {
            setErrorMessage(err.message || 'Sandbox payment confirmation failed');
            setLoading(false);
          }
        }, 1500);
        return;
      }

      // Initialize official Razorpay Payment popup
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your connection.');
      }

      const options = {
        key,
        amount,
        currency,
        name: 'Samaagum',
        description: `Upgrade to ${previewData.planName} (${previewData.billingCycle})`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            setLoading(true);
            const confirmRes = await fetch(`${apiBase}/api/subscription/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                localOrderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            const confirmData = await confirmRes.json();
            if (!confirmData.success) {
              throw new Error(confirmData.message || 'Payment verification failed');
            }

            st.setSubscription({
              plan: checkoutParams.selectedPlan.name.toLowerCase(),
              status: 'active',
              planId: checkoutParams.selectedPlan.id,
              orderNumber: confirmData.data.order_number
            });

            go("checkout-success", {
              order_number: confirmData.data.order_number,
              plan_name: confirmData.data.plan_name,
              billing_cycle: confirmData.data.billing_cycle,
              activated_at: confirmData.data.activated_at,
              next_billing_at: confirmData.data.next_billing_at,
              subscription_status: confirmData.data.subscription_status,
              total: previewData.totalAmount
            });
          } catch (err: any) {
            setErrorMessage(err.message || 'Error confirming payment');
            setLoading(false); // Enable buttons again if failed
          } 
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without paying
            setLoading(false);
          }
        },
        prefill: {
          name: `${checkoutParams.shippingAddress.firstName} ${checkoutParams.shippingAddress.lastName}`,
          email: checkoutParams.billingAddress.email,
          contact: checkoutParams.billingAddress.phone
        },
        theme: {
          color: '#6d5efc'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMessage(response.error.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error processing checkout');
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="glass-card scroll" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg)', position: 'relative', padding: "40px 32px" }}>
        
        <button 
          onClick={onClose} 
          disabled={loading}
          style={{ position: 'absolute', top: 20, right: 20, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
        >
          <I.x style={{ width: 16, height: 16, color: 'var(--ink-2)' }} />
        </button>

        <div className="v-header" style={{ marginBottom: 32 }}>
          <h2 className="v-title">Order Review</h2>
          <p className="v-subtitle">Please confirm your order details before proceeding to payment.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Plan:</span>
          <span style={{ fontWeight: 600 }}>{previewData.planName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Billing Cycle:</span>
          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{previewData.billingCycle}</span>
        </div>

        <div className="pricing-rows" style={{ marginBottom: 24 }}>
          <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Subtotal</span>
            <span>{formatPrice(previewData.baseAmount, previewData.currency)}</span>
          </div>
          <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>GST (18%)</span>
            <span>{formatPrice(previewData.gstAmount, previewData.currency)}</span>
          </div>
          {previewData.discountAmount > 0 && (
            <div className="price-row discount" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--accent-1)' }}>
              <span>Coupon Discount</span>
              <span>-{formatPrice(previewData.discountAmount, previewData.currency)}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>Total Payable</h3>
          <h3 style={{ margin: 0, fontSize: 24, color: 'var(--primary)' }}>{formatPrice(previewData.totalAmount, previewData.currency)}</h3>
        </div>

        {errorMessage && (
          <div className="checkout-error-msg" style={{ marginBottom: 24 }}>
            <span className="bullet"><I.x style={{ width: 14, height: 14 }} /></span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="terms-container" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={agreedTerms} 
              onChange={e => setAgreedTerms(e.target.checked)} 
              disabled={loading}
              style={{ marginTop: 4 }}
            />
            <span style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.4 }}>I agree to the Terms & Conditions</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={agreedRecurring} 
              onChange={e => setAgreedRecurring(e.target.checked)} 
              disabled={loading}
              style={{ marginTop: 4 }}
            />
            <span style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.4 }}>I understand this subscription may renew according to the selected billing cycle</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            className="btn-sub-cta" 
            style={{ 
              flex: 1, 
              margin: 0,
              background: 'var(--surface-1)',
              color: 'var(--ink-1)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }} 
            onClick={onClose}
            disabled={loading}
          >
            <I.arrowL style={{ width: 16, height: 16 }} /> Back to Checkout
          </button>
          <button 
            className={`btn-sub-cta btn-sub-pay ${loading ? 'loading' : ''}`} 
            style={{ flex: 1, margin: 0 }}
            onClick={handleProceedToPayment}
            disabled={loading || !agreedTerms || !agreedRecurring}
          >
            {loading ? (
              <>
                <span className="spinner-small" /> Creating Order...
              </>
            ) : (
              <>
                <I.lock style={{ width: 14, height: 14 }} /> Proceed to Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};



/* ──────────────────────────────────────────────────────────────
   3. CHECKOUT SUCCESS PAGE
   ────────────────────────────────────────────────────────────── */
window.CheckoutSuccessPage = function CheckoutSuccessPage({ param, go }) {
  const { order_number, plan_name, billing_cycle, activated_at, next_billing_at, subscription_status, total } = param || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

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
          <span className="val">{order_number || 'SAMA-MOCK'}</span>
        </div>
        <div className="success-row">
          <span className="label">Plan Name:</span>
          <span className="val">{plan_name || 'Premium Plan'}</span>
        </div>
        <div className="success-row">
          <span className="label">Billing Cycle:</span>
          <span className="val" style={{ textTransform: 'capitalize' }}>{billing_cycle || 'monthly'}</span>
        </div>
        <div className="success-row">
          <span className="label">Activation Date:</span>
          <span className="val">{formatDate(activated_at)}</span>
        </div>
        <div className="success-row">
          <span className="label">Renewal Date:</span>
          <span className="val">{formatDate(next_billing_at)}</span>
        </div>
        <div className="success-row">
          <span className="label">Total Paid:</span>
          <span className="val">{formatPrice(total || 0)}</span>
        </div>
        <div className="success-row">
          <span className="label">Subscription Status:</span>
          <span className="val active-status-tag">{subscription_status ? subscription_status.toUpperCase() : 'ACTIVE'}</span>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"center", gap: 16, marginTop: 32 }}>
        <button 
          className="btn" 
          style={{ 
            padding: "12px 24px", 
            borderRadius: 8,
            background: 'rgba(18, 8, 101, 0.25)', 
            color: 'var(--ink-1)', 
            fontWeight: 600,
            border: 'none',
            boxShadow: '0 4px 12px rgba(109, 94, 252, 0.25)',
            cursor: 'pointer',
            minWidth: 160
          }} 
          onClick={() => go("home")}
        >
          Go to Home Feed
        </button>
        <button 
          className="btn" 
          style={{ 
            padding: "12px 24px", 
            borderRadius: 8,
            background: 'rgba(18, 8, 101, 0.25)', 
            color: 'var(--ink-1)', 
            fontWeight: 600,
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(109, 94, 252, 0.25)',
            cursor: 'pointer',
            minWidth: 160
          }} 
          onClick={() => go("profile")}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
