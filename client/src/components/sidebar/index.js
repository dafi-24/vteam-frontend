import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { logout } from '../../authUtils';
import "../../style/sidebar.css";

export default function Sidebar() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className={"sidebar" + (open ? " open" : "") }>
            <div className="logo">
                <img
                    src={process.env.PUBLIC_URL + "/logga.png"}
                    alt="VTeam logga"
                    className="logo-img"
                />
                <button className="sidebar-toggle" onClick={() => setOpen(o => !o)}>
                    <span className="hamburger">&#9776;</span>
                </button>
            </div>
            <div className="sidebar-links">
                <Link to="/">Home</Link>
                <Link to="/maps">Go to Bikes</Link>
                <Link to="/profile">Go to Profile</Link>
                <Link to="/payments">Betalningar</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
        </nav>
    );
}
