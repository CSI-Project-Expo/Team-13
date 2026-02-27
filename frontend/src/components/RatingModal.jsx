import { useState } from 'react';

export default function RatingModal({ job, onClose, onSubmit, loading }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ rating, comment });
    };

    if (!job) return null;

    return (
        <div className="modal-overlay">
            <div className="auth-card" style={{ maxWidth: 450 }}>
                <h2 className="auth-card__title">Rate User</h2>
                <p className="auth-card__sub">How was your experience with {job.user?.name || 'this user'}?</p>

                <form onSubmit={handleSubmit} className="auth-form" style={{ gap: 20 }}>
                    <div className="form-group">
                        <label className="form-label">Rating</label>
                        <div style={{
                            display: 'flex', gap: 6, fontSize: 28,
                            background: 'var(--surface-2)',
                            border: '2.5px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px', width: 'fit-content',
                            boxShadow: '3px 3px 0 var(--border)',
                        }}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setRating(num)}
                                    style={{
                                        color: num <= rating ? 'var(--amber)' : 'var(--border)',
                                        transition: 'transform 0.15s',
                                        transform: num <= rating ? 'scale(1.2)' : 'scale(1)',
                                        background: 'none', border: 'none', padding: 0,
                                        fontSize: 28,
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4,
                            fontWeight: 700, textTransform: 'uppercase' }}>
                            {rating >= 3 ? `🎉 User will receive reward points!` : `No points awarded for < 3 stars.`}
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Comment (Optional)</label>
                        <textarea
                            className="form-input form-textarea"
                            placeholder="Very polite and cooperative..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={500}
                        />
                    </div>

                    <div className="form-actions" style={{ marginTop: 10 }}>
                        <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
