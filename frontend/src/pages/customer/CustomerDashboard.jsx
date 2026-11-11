import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingAPI, paymentAPI, reviewsAPI, complaintsAPI, authAPI } from '../../services/api';
import SEOHead from '../../components/SEOHead';
import {
  ShoppingBag, CheckCircle, Clock, XCircle, AlertCircle, Phone,
  MessageCircle, Star, ShieldCheck, IndianRupee, Loader2, ArrowRight,
  Eye, RefreshCw, Key, HelpCircle, Trash2
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // bookings | complaints | account
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState('ADVANCE'); // ADVANCE or REMAINING

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getMyBookings();
      setBookings(res?.bookings || []);
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to load bookings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleQuotationResponse = async (bookingId, action) => {
    setActionLoading(true);
    try {
      const res = await bookingAPI.respondToQuotation(bookingId, { action });
      setFeedbackMsg({ text: res.message, type: 'success' });
      await fetchBookings();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Action failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulatePayment = async (bookingId, type) => {
    setActionLoading(true);
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      const amount = type === 'ADVANCE' ? booking.advanceAmount : booking.remainingAmount;
      const ref = `TEST-UPI-${Date.now().toString().slice(-6)}`;

      const res = await paymentAPI.recordPayment({
        bookingId,
        paymentType: type,
        paymentMethod: 'UPI',
        transactionReference: ref,
      });

      setFeedbackMsg({ text: `Payment of ₹${amount} successful (Ref: ${ref})!`, type: 'success' });
      setShowPaymentModal(false);
      await fetchBookings();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Payment simulation failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await reviewsAPI.submitReview({
        bookingId: selectedBooking.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setFeedbackMsg({ text: 'Thank you! Review submitted successfully.', type: 'success' });
      setShowReviewModal(false);
      setReviewComment('');
      await fetchBookings();
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to submit review.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await complaintsAPI.submitComplaint({
        bookingId: selectedBooking?.id,
        farmId: selectedBooking?.farmId,
        subject: complaintSubject,
        description: complaintDescription,
      });
      setFeedbackMsg({
        text: 'Complaint submitted. KodiKart support team will review and contact you within 2 business days.',
        type: 'success',
      });
      setShowComplaintModal(false);
      setComplaintSubject('');
      setComplaintDescription('');
    } catch (err) {
      setFeedbackMsg({ text: err.message || 'Failed to submit complaint.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to request account deletion? All personal data will be purged according to our Privacy Policy.')) {
      return;
    }
    try {
      await authAPI.requestDeletion();
      alert('Your account deletion request has been processed. Signing out...');
      logout();
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to request account deletion.');
    }
  };

  const getStatusBadge = (status, isNoAdvance) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="status-requested">Pending Farm Review</span>;
      case 'QUOTED':
        return <span className="status-quoted">Quotation Ready</span>;
      case 'QUOTE_ACCEPTED':
        return isNoAdvance
          ? <span className="status-confirmed">Confirmed (No Advance)</span>
          : <span className="status-quote-accepted">Quotation Accepted • Pay 20% Advance</span>;
      case 'CONFIRMED':
        return <span className="status-confirmed">Confirmed • Advance Paid</span>;
      case 'READY_FOR_HANDOVER':
        return <span className="status-ready">Ready for Handover • Share OTP</span>;
      case 'COMPLETED':
        return <span className="status-completed">Completed</span>;
      case 'QUOTE_REJECTED':
      case 'CANCELLED':
        return <span className="status-cancelled">Cancelled</span>;
      default:
        return <span className="status-completed">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-cream py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead title="Customer Dashboard | KodiKart" />

      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <h1 className="text-2xl font-bold text-brown">
                Welcome back, {user?.name || 'Customer'}!
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Mobile: +91 {user?.phone} • Email: {user?.email}
            </p>
          </div>
          <Link
            to="/farms"
            className="btn-primary flex items-center gap-2 text-sm shadow-md"
          >
            <span>Browse More Farms</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg.text && (
          <div
            className={`p-4 rounded-xl text-sm mb-6 flex items-center justify-between ${
              feedbackMsg.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg({ text: '', type: '' })}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-gray-500 hover:text-brown'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Bookings ({bookings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-gray-500 hover:text-brown'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Account & Privacy</span>
          </button>
        </div>

        {/* Tab 1: Bookings List */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl shadow-sm">
                <Loader2 className="w-8 h-8 text-green-700 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
                <span className="text-5xl block mb-3">🌾</span>
                <h3 className="text-lg font-bold text-brown mb-1">No bookings yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You haven't requested any native desi hens yet. Browse local farms and place your first booking!
                </p>
                <Link to="/farms" className="btn-primary">Browse Verified Farms</Link>
              </div>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-green-800">
                          {booking.bookingNumber}
                        </span>
                        {getStatusBadge(booking.status, booking.isNoAdvanceAllowed)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} • Farm: <strong className="text-brown">{booking.farm?.farmName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.farm?.phone && (
                        <a
                          href={`tel:${booking.farm.phone}`}
                          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-brown px-3 py-1.5 rounded-lg font-medium"
                          title="Call Farm Owner"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call Farm
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Breed:</span>
                      <strong className="text-brown text-sm">{booking.breed?.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Requested:</span>
                      <strong className="text-brown text-sm">
                        {booking.requestedQuantity} Hen(s) ({booking.desiredWeightKg} kg)
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Fulfillment:</span>
                      <strong className="text-brown text-sm capitalize">{booking.deliveryType}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Total Payable:</span>
                      <strong className="text-green-700 text-base font-extrabold">
                        {parseFloat(booking.finalTotalAmount) > 0 ? `₹${booking.finalTotalAmount}` : 'Awaiting Quotation'}
                      </strong>
                    </div>
                  </div>

                  {/* QUOTATION CARD (Status: QUOTED) */}
                  {booking.status === 'QUOTED' && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 my-4">
                      <div className="flex items-center justify-between pb-3 border-b border-blue-200 mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-700" />
                          <h4 className="font-bold text-blue-900 text-sm">
                            Quotation Ready from Farm
                          </h4>
                        </div>
                        <span className="text-xs text-blue-700 font-medium">
                          24 hours to review
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-blue-950 mb-4">
                        <p>The farmer has selected and weighed individual hens for you:</p>
                        <div className="bg-white rounded-lg p-3 border border-blue-100 divide-y divide-gray-100">
                          {booking.assignedHens?.map((item, idx) => (
                            <div key={item.id} className="py-1.5 flex justify-between items-center text-xs">
                              <span>Hen #{idx + 1} ({item.hen?.henId}):</span>
                              <span><strong>{item.confirmedWeightKg} kg</strong> @ ₹{item.pricePerKg}/kg</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between pt-1">
                          <span>Total Confirmed Weight:</span>
                          <strong>{booking.totalHenWeightKg} kg</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Hen Amount (includes 3% commission):</span>
                          <span>₹{booking.customerHenAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery Fee ({booking.deliveryType}):</span>
                          <span>₹{booking.deliveryFee}</span>
                        </div>
                        <div className="flex justify-between text-sm font-extrabold text-blue-900 border-t border-blue-200 pt-2">
                          <span>Final Total Amount:</span>
                          <span>₹{booking.finalTotalAmount}</span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-800 font-bold bg-blue-100 p-2 rounded-lg">
                          <span>20% Advance required to confirm:</span>
                          <span>₹{booking.advanceAmount}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleQuotationResponse(booking.id, 'ACCEPT')}
                          disabled={actionLoading}
                          className="flex-1 btn-primary py-2.5 text-sm"
                        >
                          Accept Quotation
                        </button>
                        <button
                          onClick={() => handleQuotationResponse(booking.id, 'REJECT')}
                          disabled={actionLoading}
                          className="btn-danger py-2.5 text-sm px-4"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ADVANCE PAYMENT TRIGGER (Status: QUOTE_ACCEPTED) */}
                  {booking.status === 'QUOTE_ACCEPTED' && !booking.isNoAdvanceAllowed && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 my-4">
                      <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm">
                        <IndianRupee className="w-5 h-5 text-gold" />
                        <span>Advance Payment Required to Confirm</span>
                      </div>
                      <p className="text-xs text-amber-800 mb-4">
                        You accepted the quotation. Please pay the 20% advance (<strong>₹{booking.advanceAmount}</strong>) to lock your hens and confirm the order.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setPaymentType('ADVANCE');
                          setShowPaymentModal(true);
                        }}
                        className="btn-secondary text-sm px-6 py-2.5 shadow-md flex items-center gap-2"
                      >
                        <IndianRupee className="w-4 h-4" />
                        <span>Pay 20% Advance (₹{booking.advanceAmount})</span>
                      </button>
                    </div>
                  )}

                  {/* HANDOVER OTP DISPLAY (Status: READY_FOR_HANDOVER) */}
                  {booking.status === 'READY_FOR_HANDOVER' && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-500 rounded-xl p-5 my-4">
                      <div className="flex items-center gap-2 mb-2 text-green-900 font-extrabold text-base">
                        <Key className="w-6 h-6 text-green-700 animate-bounce" />
                        <span>Hen Handover In Progress!</span>
                      </div>
                      <p className="text-xs text-green-800 mb-3">
                        The farm owner or delivery agent is ready with your live hens.
                        An OTP has been dispatched to your email (<strong>{user?.email}</strong>).
                      </p>
                      <div className="bg-white p-4 rounded-xl border border-green-300 text-center my-3">
                        <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">
                          Handover Verification
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Share the 6-digit OTP from your email with the farmer in person to verify and collect your hens.
                        </p>
                      </div>

                      {!booking.remainingPaid && (
                        <div className="mt-3 flex items-center justify-between bg-white bg-opacity-70 p-3 rounded-lg text-xs">
                          <span>Remaining 80% Due: <strong>₹{booking.remainingAmount}</strong></span>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setPaymentType('REMAINING');
                              setShowPaymentModal(true);
                            }}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            Pay Remaining Online
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for COMPLETED Order */}
                  {booking.status === 'COMPLETED' && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 mt-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowReviewModal(true);
                        }}
                        className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-gold" />
                        <span>{booking.review ? 'Review Submitted' : 'Rate & Review Farm'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowComplaintModal(true);
                        }}
                        className="text-xs text-gray-500 hover:text-red-600 py-1.5 px-3"
                      >
                        Report an Issue
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Account & Privacy */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-bold text-brown">Account & Privacy Controls</h3>
            <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Mobile:</strong> +91 {user?.phone}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p className="text-xs text-gray-500 pt-1">
                Authentication: Passwordless OTP (Resend.com). Plaintext credentials are never stored.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-base font-bold text-red-600 mb-2">Danger Zone</h4>
              <p className="text-xs text-gray-500 mb-4">
                You can permanently request deletion of your KodiKart account and personal records. Completed booking history is retained for financial compliance.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="btn-danger text-xs py-2 px-4 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Request Account Deletion</span>
              </button>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-brown mb-2">Review {selectedBooking?.farm?.farmName}</h3>
              <p className="text-xs text-gray-500 mb-4">
                Share your experience with this farm's desi hens and delivery service.
              </p>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brown mb-1">Rating (1 to 5 Stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-2xl"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-gold fill-gold' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown mb-1">Your Feedback (Optional)</label>
                  <textarea
                    rows="3"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Healthy hens, exact weights, prompt delivery..."
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={actionLoading} className="btn-primary flex-1 py-2 text-sm">
                    {actionLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="btn-outline py-2 text-sm px-4"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complaint Modal */}
        {showComplaintModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-red-600 mb-2">Submit a Complaint</h3>
              <p className="text-xs text-gray-500 mb-4">
                Our support team investigates all issues regarding health, weight discrepancies, or delivery delays.
              </p>
              <form onSubmit={handleSubmitComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-brown mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="e.g. Weight mismatch, delivery delay"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brown mb-1">Detailed Description *</label>
                  <textarea
                    rows="4"
                    required
                    value={complaintDescription}
                    onChange={(e) => setComplaintDescription(e.target.value)}
                    placeholder="Describe what occurred with your order..."
                    className="input-field text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={actionLoading} className="btn-danger flex-1 py-2 text-sm">
                    {actionLoading ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="btn-outline py-2 text-sm px-4"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Simulation Modal (Zero Cost Test Gateway) */}
        {showPaymentModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <IndianRupee className="w-6 h-6" />
                <h3 className="text-lg font-bold">
                  {paymentType === 'ADVANCE' ? 'Pay 20% Advance' : 'Pay Remaining 80%'}
                </h3>
              </div>

              <div className="bg-green-50 p-4 rounded-xl text-xs space-y-1 text-green-900">
                <div className="flex justify-between">
                  <span>Booking Number:</span>
                  <strong>{selectedBooking.bookingNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Payment Type:</span>
                  <span className="capitalize">{paymentType}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-green-800 pt-2 border-t border-green-200">
                  <span>Payable Amount:</span>
                  <span>
                    ₹{paymentType === 'ADVANCE' ? selectedBooking.advanceAmount : selectedBooking.remainingAmount}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                In this ₹0 evaluation deployment, you can verify the end-to-end payment confirmation flow instantly using test UPI verification.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleSimulatePayment(selectedBooking.id, paymentType)}
                  className="btn-primary flex-1 py-2.5 text-sm"
                >
                  {actionLoading ? 'Processing...' : `Simulate UPI Payment (₹${paymentType === 'ADVANCE' ? selectedBooking.advanceAmount : selectedBooking.remainingAmount})`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-outline py-2.5 text-sm px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
