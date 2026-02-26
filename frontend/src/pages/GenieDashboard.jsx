import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import RatingModal from '../components/RatingModal';

function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text skeleton--short" />
        </div>
    );
}

const TABS = [
    { key: 'available', label: '🔍 Available Jobs' },
    { key: 'my-jobs', label: '📋 My Assignments' },
];

export default function GenieDashboard() {
    const { user, fetchMe } = useAuth();
    const [tab, setTab] = useState('available');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [rateUserJob, setRateUserJob] = useState(null);
    const [isRating, setIsRating] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const loadJobs = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint =
                tab === 'available'
                    ? '/api/v1/jobs/available'
                    : '/api/v1/jobs/my-jobs';
            const data = await api.get(endpoint);
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => { loadJobs(); }, [loadJobs]);

    const handleAccept = async (job) => {
        setActionId(job.id);
        try {
            // Use PATCH method for job acceptance with wallet validation
            const result = await api.patch(`/api/v1/jobs/${job.id}/accept`, {});
            showToast(
                `Job accepted! ₹${result.escrow_amount} moved to escrow. User wallet balance: ₹${result.user_wallet_balance}`
            );
            loadJobs();
        } catch (err) {
            // Handle specific error cases
            if (err.status === 400 && err.message?.includes('Insufficient')) {
                showToast(`Cannot accept: User has insufficient wallet balance for this job.`);
            } else if (err.status === 409) {
                showToast(`Job already assigned to another genie.`);
            } else {
                showToast(`Error: ${err.message}`);
            }
        } finally {
            setActionId(null);
        }
    };

    const handleStart = async (job) => {
        setActionId(job.id);
        try {
            await api.post(`/api/v1/jobs/${job.id}/start`, {});
            showToast('Job started! Good luck 🚀');
            loadJobs();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        } finally {
            setActionId(null);
        }
    };

    const handleComplete = async (job) => {
        setActionId(job.id);
        try {
            await api.post(`/api/v1/jobs/${job.id}/complete`, {});
            showToast('Job marked as complete! 🎉');
            loadJobs();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        } finally {
            setActionId(null);
        }
    };

    const handleRateUser = async ({ rating, comment }) => {
        setIsRating(true);
        try {
            const res = await api.post(`/api/v1/jobs/${rateUserJob.id}/rate-user`, { rating, comment });
            showToast(`Rated successfully! User earned ${res.points_awarded} points.`);
            setRateUserJob(null);
            loadJobs();
            // Refresh AuthContext to update points in Navbar
            fetchMe();
        } catch (err) {
            showToast(`Error: ${err.message}`);
        } finally {
            setIsRating(false);
        }
    };

    const getAction = (job) => {
        if (tab === 'available') return { label: 'Accept Job', handler: handleAccept };
        if (job.status === 'ACCEPTED') return { label: 'Start Job', handler: handleStart };
        if (job.status === 'IN_PROGRESS') return { label: 'Mark Complete', handler: handleComplete };
        if (job.status === 'COMPLETED' && !job.genie_rating) {
            return { label: 'Rate User', handler: () => setRateUserJob(job) };
        }
        return null;
    };

    return (
        <div className="page">
            <Navbar />
            <main className="page__content">
                <div className="page__header">
                    <div>
                        <h1 className="page__title">Genie Dashboard</h1>
                        <p className="page__subtitle">Hello, {user?.name || 'Genie'} 🧞‍♂️ (Do4U 🚀)</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="filter-tabs">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            className={`filter-tab${tab === t.key ? ' filter-tab--active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="job-grid">
                        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : jobs.length === 0 ? (
                    <EmptyState
                        icon={tab === 'available' ? '🔍' : '📋'}
                        title={tab === 'available' ? 'No available jobs' : 'No assignments yet'}
                        message={
                            tab === 'available'
                                ? 'Check back soon — new jobs are posted regularly.'
                                : 'Accept a job to see it here.'
                        }
                    />
                ) : (
                    <div className="job-grid">
                        {jobs.map((job) => {
                            const action = getAction(job);
                            return (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onAction={action?.handler}
                                    actionLabel={action?.label}
                                    loading={actionId === job.id}
                                />
                            );
                        })}
                    </div>
                )}
            </main>

            {rateUserJob && (
                <RatingModal
                    job={rateUserJob}
                    loading={isRating}
                    onClose={() => setRateUserJob(null)}
                    onSubmit={handleRateUser}
                />
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
