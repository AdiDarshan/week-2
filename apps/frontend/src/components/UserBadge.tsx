import { useAuth } from '../hooks/useAuth';

export function UserBadge() {
  const { auth, logout } = useAuth();
  if (!auth){
    return null;
  } 

  return (
    <div className="user-badge">
      <span className="user-badge-name">Signed in as {auth.user.name}</span>
      <button type="button" className="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
