import { useNavigate, Link } from 'react-router-dom';
import ParallaxBg from '../components/ParallaxBg';

const ROLES = [
    {
        id: 'user',
        emoji: '👤',
        title: 'I need help',
        subtitle: 'Post jobs and hire Genies to get things done',
    },
    {
        id: 'genie',
        emoji: '🧞',
        title: "I'm a Genie",
        subtitle: 'Browse jobs nearby and earn on your terms',
    },
];

export default function RoleSelect() {
    const navigate = useNavigate();

    return (
        <div className="role-select">
            <ParallaxBg />
            <div className="role-select__card">
                <h1 className="role-select__heading">Welcome to <span className="accent">Do4U</span></h1>
                <p className="role-select__sub">How do you want to use the platform today?</p>

                <div className="role-select__grid">
                    {ROLES.map((r) => (
                        <button
                            key={r.id}
                            className="role-tile"
                            onClick={() => navigate(`/login?role=${r.id}`)}
                        >
                            <span className="role-tile__icon">{r.emoji}</span>
                            <strong className="role-tile__title">{r.title}</strong>
                            <span className="role-tile__subtitle">{r.subtitle}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
