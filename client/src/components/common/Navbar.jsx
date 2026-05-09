import './Navbar.css';

function Navbar() {
  return (
    <div className="navbar">
      <h1 className="logo">NexClass</h1>

      <div className="nav-buttons">
        <button className="nav-btn">Home</button>
        <button className="nav-btn">Login</button>
      </div>
    </div>
  );
}

export default Navbar;