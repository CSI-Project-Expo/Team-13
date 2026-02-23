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
            <div className="modal-card auth-card" style={{ maxWidth: 450 }}>
                <h2 className="auth-card__title">Rate User</h2>
                <p className="auth-card__sub">How was your experience with {job.user?.name || 'this user'}?</p>

                <form onSubmit={handleSubmit} className="auth-form" style={{ gap: 20 }}>
                    <div className="form-group">
                        <label className="form-label">Rating</label>
                        <div style={{ display: 'flex', gap: 10, fontSize: 24 }}>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setRating(num)}
                                    style={{
                                        color: num <= rating ? 'var(--amber)' : 'var(--border)',
                                        transition: 'transform 0.2s',
                                        transform: num <= rating ? 'scale(1.2)' : 'scale(1)'
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
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
